import { v4 as uuidv4 } from "uuid";

export const uuidv4Generator = ({
  format,
}: {
  format?: "uuidv4" | "crypto";
}) => {
  if (format?.includes("uuid")) {
    return uuidv4(); // Generate a random UUID
  } else {
    return crypto.randomUUID(); // Generate a random UUID
  }
};
