// src/utils/create-hmac-signature.ts
import crypto from "crypto";
import { env } from "../app/config/env";

/**
 * Stable JSON canonicalization for plain objects & arrays.
 *
 * Goals:
 *  - Insertion order MUST NOT affect the canonical output.
 *  - Arrays MUST preserve order.
 *  - `undefined` object properties MUST be omitted.
 *  - `null` MUST be preserved.
 *  - Primitive types MUST be coerced consistently (numbers, booleans, bigints).
 *  - Original inputs MUST NOT be mutated.
 *
 * The output is `JSON.stringify`-safe and identical for structurally equal
 * inputs regardless of how the caller constructed them.
 */
export const canonicalJsonStringify = (value: unknown): string => {
  return JSON.stringify(canonicalize(value));
};

const canonicalize = (value: unknown): unknown => {
  if (value === null) return null;

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value instanceof Date) {
    // Use ISO so the canonical string is deterministic across timezones.
    return value.toISOString();
  }

  if (Buffer.isBuffer(value)) {
    return value.toString("utf8");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const out: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      const v = obj[key];
      if (v === undefined) continue;
      out[key] = canonicalize(v);
    }
    return out;
  }

  // primitives (string, number, boolean, bigint)
  return value;
};

/**
 * Recursive normalizer that returns a deep-cloned, key-sorted representation
 * safe to feed into canonicalJsonStringify. Mirrors canonicalize() but
 * explicitly returns a new value so callers cannot accidentally reuse it.
 */
export const normalizeJson = <T>(value: T): T => {
  return canonicalize(value) as T;
};

/**
 * Normalize a query object into a deterministic, alphabetically sorted map
 * where every primitive value is coerced to a string. Arrays are preserved
 * (the receiver will normally see them as repeated keys).
 *
 * `undefined` values are omitted.
 */
export const normalizeQuery = (
  query: Record<string, unknown> | undefined,
): Record<string, string | string[]> => {
  const result: Record<string, string | string[]> = {};

  if (!query) return result;

  const keys = Object.keys(query).sort();

  for (const key of keys) {
    const value = query[key];

    if (value === undefined) continue;

    if (Array.isArray(value)) {
      const filtered: string[] = [];
      for (const v of value) {
        if (v === undefined || v === null) continue;
        filtered.push(String(v));
      }
      if (filtered.length === 0) continue;
      result[key] = filtered;
      continue;
    }

    if (value === null) {
      result[key] = "null";
      continue;
    }

    if (typeof value === "object") {
      // Fall back to canonical JSON for nested objects. This keeps the
      // canonical signature deterministic even if a caller passes an object
      // value (e.g. complex filter expressions).
      result[key] = canonicalJsonStringify(value);
      continue;
    }

    if (typeof value === "boolean") {
      result[key] = value ? "true" : "false";
      continue;
    }

    result[key] = String(value);
  }

  return result;
};

export type CreateInternalRequestSignatureInput = {
  method: string;
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  requestId: string;
  timestamp: number;
  secret?: string;
};

export type InternalRequestSignatureResult = {
  signature: string;
  canonicalPayload: string;
  normalizedBody: unknown;
  normalizedQuery: Record<string, string | string[]>;
  timestamp: number;
  requestId: string;
};

/**
 * Build the canonical HMAC payload used by the sender.
 *
 * Canonical format (newline-separated):
 *
 *   METHOD
 *   PATH
 *   NORMALIZED_QUERY_JSON
 *   TIMESTAMP
 *   REQUEST_ID
 *   NORMALIZED_BODY_JSON
 *
 * The receiver MUST reconstruct the same string before re-computing the HMAC,
 * otherwise signatures will not match.
 */
export const createInternalRequestSignature = (
  input: CreateInternalRequestSignatureInput,
): InternalRequestSignatureResult => {
  const method = input.method.toUpperCase();
  const path = input.path;
  const timestamp = input.timestamp;
  const requestId = input.requestId;

  const normalizedQuery = normalizeQuery(input.query);

  // For GET the canonical body is the empty object. Callers may pass undefined.
  const isGet = method === "GET";
  const normalizedBody = isGet ? {} : normalizeJson(input.body ?? {});

  const canonicalPayload = [
    method,
    path,
    JSON.stringify(normalizedQuery),
    String(timestamp),
    requestId,
    JSON.stringify(normalizedBody),
  ].join("\n");

  const secret = input.secret ?? env.JWT_REFRESH_SECRET;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(canonicalPayload)
    .digest("hex");

  return {
    signature,
    canonicalPayload,
    normalizedBody,
    normalizedQuery,
    timestamp,
    requestId,
  };
};

/**
 * Lightweight, non-reversible fingerprint of the signing secret.
 * Used only for debug logs to distinguish between secret values without
 * leaking the secret itself.
 */
export const getSigningSecretFingerprint = (
  secret: string = env.JWT_REFRESH_SECRET,
): { length: number; fingerprint: string } => {
  return {
    length: secret.length,
    fingerprint: crypto
      .createHash("sha256")
      .update(secret)
      .digest("hex")
      .slice(0, 12),
  };
};