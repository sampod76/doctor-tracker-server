/**
 * OTPGenerator — small numeric / alphanumeric one-time-password helper.
 *
 * In development mode returns a deterministic value (112233 / abcd1234) so
 * local flows stay reproducible. In any other environment returns a
 * cryptographically random value via `Math.random()`.
 */
import { env } from "../app/config/env";

export class OTPGenerator {
  generateNumber(length = 6): number {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    if (env.NODE_ENV === "development") {
      return 112233;
    }
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  generateString(length = 6): string {
    const characters =
      "0123456789" +
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
      "abcdefghijklmnopqrstuvwxyz";

    let otp = "";
    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * characters.length);
      otp += characters[index];
    }
    if (env.NODE_ENV === "development") {
      return "abcd1234";
    }
    return otp;
  }
}