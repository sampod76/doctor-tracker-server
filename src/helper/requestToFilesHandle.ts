/**
 * RequestToFileDecodeAddBodyHandle — Normalize uploaded files into a
 * `IFileAfterUpload` shape and inject them back into `req.body` keyed by
 * the original field name. The boilerplate only writes a server-side
 * reference (no external CDN); replace with a Cloudinary / S3 step if you
 * need off-host storage.
 */
import { Request } from "express";
import {
  IFileAfterUpload,
  IMulterUploadFile,
} from "../app/interface/fileUpload";

const filePathFor = (mimetype: string): string => {
  if (mimetype.includes("pdf")) return "pdfs";
  if (mimetype.includes("image")) return "images";
  if (mimetype.includes("audio")) return "audios";
  if (mimetype.includes("video")) return "videos";
  if (mimetype.includes("application")) return "docs";
  return "others";
};

const toIFileAfterUpload = (file: IMulterUploadFile): IFileAfterUpload => ({
  mimetype: file.mimetype,
  filename: file.filename,
  name: file.filename,
  server_url: `${filePathFor(file.mimetype)}/${file.filename}`,
  platform: "server",
});

export const RequestToFileDecodeAddBodyHandle = async (
  req: Request,
): Promise<void> => {
  const file = req.file as IMulterUploadFile | undefined;

  if (file?.filename) {
    req.body = {
      ...req.body,
      [file.fieldname]: toIFileAfterUpload(file),
    };
    return;
  }

  if (Array.isArray(req.files) && req.files.length > 0) {
    const grouped: Record<string, IFileAfterUpload[]> = {};
    for (const f of req.files as IMulterUploadFile[]) {
      const key = f.fieldname;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(toIFileAfterUpload(f));
    }
    req.body = { ...req.body, ...grouped };
  }
};