/**
 * imageLinkGeneratorByObject — derive a presentable URL for an
 * `IFileAfterUpload` value. Prefers the explicit `cdn`, then the raw
 * `url`, then a server-side path. Falls back to a generic 404 thumbnail
 * so callers don't crash on missing values.
 */
import { IFileAfterUpload } from "../app/interface/fileUpload";

const FALLBACK_THUMBNAIL =
  "https://img.freepik.com/free-vector/404-error-with-landscape-concept-illustration_114360-7898.jpg";

export const imageLinkGeneratorByObject = (
  imageObject?: IFileAfterUpload,
): string => {
  if (imageObject?.cdn) {
    return `${imageObject.cdn}/${imageObject.path ?? ""}`;
  }
  if (imageObject?.url) {
    return imageObject.url;
  }
  return FALLBACK_THUMBNAIL;
};