import { v4 as uuidV4, version as uuidVersion, validate } from "uuid";
export const uuidGenerator = () => {
  // Generate a random UUID
  return crypto.randomUUID();
};

export class UuidBuilder {
  uuid: string;
  uuidType: "crypto" | "uuid";
  constructor(uidType: "crypto" | "uuid" = "crypto") {
    this.uuidType = uidType;
    if (this.uuidType === "crypto") {
      // Use crypto.randomUUID() for generating cryptographically secure UUIDs
      this.uuid = crypto.randomUUID();
    } else {
      // Use uuidV4() for generating version 4 UUIDs
      this.uuid = uuidV4();
    }
  }
  generateUuid(): string {
    if (this.uuidType === "crypto") {
      return uuidGenerator();
    }
    // For 'v4' type, use uuidV4 from 'uuid' library
    return uuidV4();
  }
}

export class UuidUtls {
  readonly uuid: string;
  constructor(uuid: string) {
    this.uuid = uuid;
  }
  isUuidValid(): boolean {
    return validate(this.uuid);
  }

  getUuidVersion(): number {
    const version = uuidVersion(this.uuid);
    if (version > 0) {
      return version;
    }
    return 0;
  }
}

// ---------------- Regex ----------------

// Your custom CUID format
const CUID_REGEX = /^c[a-z0-9]{20,30}$/i;

// Unicode slug (Bangla + English + any language)
// Must match your zodSlugSchema output
const SLUG_REGEX = /^[\p{L}\p{M}\p{N}]+(?:-[\p{L}\p{M}\p{N}]+)*$/u;

// ---------------- Types ----------------

export type DetectResult =
  | { type: "uuid" }
  | { type: "cuid" }
  | { type: "slug" }
  | { type: "unknown" };

// ---------------- OOP Class ----------------

export class IDTypeDetector {
  private readonly value: string;

  constructor(value: string) {
    this.value = value.trim();
  }

  private isUuid(): boolean {
    return validate(this.value);
  }

  private isCuid(): boolean {
    return CUID_REGEX.test(this.value);
  }

  private isSlug(): boolean {
    return SLUG_REGEX.test(this.value);
  }

  detect(): DetectResult {
    // UUID first (most strict)
    if (this.isUuid()) {
      return {
        type: "uuid",
      };
    }

    // CUID
    if (this.isCuid()) {
      return {
        type: "cuid",
      };
    }

    // Slug (Unicode, Bangla supported)
    if (this.isSlug()) {
      return {
        type: "slug",
      };
    }

    // Unknown
    return {
      type: "unknown",
    };
  }
}
