export class PasswordGenerator {
  private length;
  private chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  constructor(length = 8) {
    this.length = length;
  }

  generate() {
    const array = new Uint8Array(this.length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => this.chars[byte % this.chars.length]).join(
      "",
    );
  }
}
