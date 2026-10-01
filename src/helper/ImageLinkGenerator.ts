import { IFileAfterUpload } from "../app/interfaces/fileUpload";

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
