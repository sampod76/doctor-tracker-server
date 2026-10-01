import CryptoJS from "crypto-js";
import ApiError from "../app/errors/ApiError";
export const encryptCryptoData = <T>(data: T | any, key: string): string => {
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key);
  return encrypted.toString();
};

export const decryptCryptoData = (data: string, key: string): any => {
  try {
    // because some time whitespace in this code
    // 'U2FsdGVkX19dOA/shL0SLR2JyDtmLpQJy88CwzgKP18YXxHGl5lrNcVpYOzLeI6ITy/cWRTBrTK0V6PkGhbl1Ik fBtfhZUFBsLHrZmvFNuC4OpxwvY79/xToKurgOskLiz7aazvvxeghiVMtnRfEw=='
    const bytes = CryptoJS.AES.decrypt(data.split(" ").join("+"), key);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  } catch (error) {
    throw new ApiError(500, "Invalid to access protected");
  }
};
