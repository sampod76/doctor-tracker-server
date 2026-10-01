import { paginationHelper } from "../src/helper/paginationHelper";
import { canonicalJsonStringify } from "../src/utils/create-hmac-signature";
import { parseDurationToMilliseconds } from "../src/helper/jwtExpiry";
import { UTCDateFormatter } from "../src/utils/UTCDateFormatter";
import { createUtcDateRange } from "../src/utils/UTCDateFormatter";

describe("paginationHelper", () => {
  it("returns sane defaults when nothing is supplied", () => {
    const result = paginationHelper.calculatePagination({});
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
    expect(result.limit).toBeGreaterThan(0);
  });

  it("computes skip based on page/limit", () => {
    const result = paginationHelper.calculatePagination({ page: 3, limit: 10 });
    expect(result.skip).toBe(20);
  });
});

describe("canonicalJsonStringify", () => {
  it("is key-order independent", () => {
    const a = canonicalJsonStringify({ b: 1, a: 2 });
    const b = canonicalJsonStringify({ a: 2, b: 1 });
    expect(a).toBe(b);
  });

  it("preserves array order", () => {
    const a = canonicalJsonStringify({ items: [1, 2, 3] });
    const b = canonicalJsonStringify({ items: [3, 2, 1] });
    expect(a).not.toBe(b);
  });
});

describe("parseDurationToMilliseconds", () => {
  it.each([
    ["7d", 7 * 86_400_000],
    ["30m", 30 * 60_000],
    ["1h", 3_600_000],
    ["500ms", 500],
  ])("parses %s", (input, expected) => {
    expect(parseDurationToMilliseconds(input, "test")).toBe(expected);
  });

  it("throws on garbage", () => {
    expect(() => parseDurationToMilliseconds("never", "test")).toThrow();
  });
});

describe("UTCDateFormatter", () => {
  it("round-trips a UTC ISO string", () => {
    const date = new Date("2026-07-25T14:40:30.000Z");
    const formatter = new UTCDateFormatter({ date });
    expect(formatter.formatUtcISOString()).toBe(date.toISOString());
  });

  it("createUtcDateRange produces an inclusive UTC range", () => {
    const range = createUtcDateRange({
      from: "2026-07-25",
      timeZone: "UTC",
    });
    expect(range.gte.toISOString().slice(0, 10)).toBe("2026-07-25");
    expect(range.lte.getTime()).toBeGreaterThanOrEqual(range.gte.getTime());
  });
});