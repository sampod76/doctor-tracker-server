export class SlugMaker {
  private static normalize(value: string, separator: "-" | "_"): string {
    const spaceToSep = separator;
    const collapseSep = separator === "-" ? /-+/g : /_+/g;
    const trimSep = separator === "-" ? /^-+|-+$/g : /^_+|_+$/g;

    return (
      value
        .trim()
        // ✅ FIXED REGEX (hyphen at end)
        .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, "")
        .replace(/\s+/g, spaceToSep)
        .replace(collapseSep, spaceToSep)
        .replace(trimSep, "")
        .toLowerCase()
    );
  }

  static toDash(value: string): string {
    return this.normalize(value, "-");
  }

  static toUnderscore(value: string): string {
    return this.normalize(value, "_");
  }
  static generateRandomSuffix(length = 6): string {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  }
}
