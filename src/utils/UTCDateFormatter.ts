import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

/**
 * Inclusive UTC date range.
 *
 * Example:
 * from = 2026-07-24T18:00:00.000Z
 * to   = 2026-07-25T17:59:59.999Z
 */
export type IUtcInclusiveDateRange = {
  from: Date;
  to: Date;
};

/**
 * Constructor input.
 *
 * `time` is optional and must use 24-hour HH:mm:ss format.
 * It can only be combined with a date-only value.
 */
export type IUTCDateFormatterInput = {
  date: string | Date;
  time?: string;
};

/**
 * Constructor options.
 */
export type IUTCDateFormatterOptions = {
  timeZone?: string;
};

export class UTCDateFormatter {
  public readonly date: string | Date;
  public readonly time?: string;
  public readonly timeZone: string;

  /**
   * Parsed date-time value stored as an immutable Dayjs instance.
   */
  private readonly parsedDate: Dayjs;

  private static readonly DEFAULT_TIME_ZONE = "UTC";
  private static readonly TIME_FORMAT = "HH:mm:ss";

  /**
   * Date-only formats accepted when a separate `time` is supplied.
   */
  private static readonly SUPPORTED_DATE_ONLY_FORMATS = [
    "YYYY-MM-DD",
    "YYYY/MM/DD",
  ] as const;

  /**
   * Supported local date/date-time formats without a timezone offset.
   *
   * Values containing `Z`, `+06:00`, `-0400`, etc. are parsed separately
   * as absolute instants.
   */
  private static readonly SUPPORTED_INPUT_FORMATS = [
    // Date only
    "YYYY-MM-DD",
    "YYYY/MM/DD",

    // 24-hour time
    "YYYY-MM-DD HH:mm",
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DD HH:mm:ss.S",
    "YYYY-MM-DD HH:mm:ss.SS",
    "YYYY-MM-DD HH:mm:ss.SSS",

    "YYYY/MM/DD HH:mm",
    "YYYY/MM/DD HH:mm:ss",
    "YYYY/MM/DD HH:mm:ss.S",
    "YYYY/MM/DD HH:mm:ss.SS",
    "YYYY/MM/DD HH:mm:ss.SSS",

    // 12-hour time
    "YYYY-MM-DD hh:mm A",
    "YYYY-MM-DD hh:mm:ss A",
    "YYYY-MM-DD hh:mm:ss.S A",
    "YYYY-MM-DD hh:mm:ss.SS A",
    "YYYY-MM-DD hh:mm:ss.SSS A",

    "YYYY/MM/DD hh:mm A",
    "YYYY/MM/DD hh:mm:ss A",
    "YYYY/MM/DD hh:mm:ss.S A",
    "YYYY/MM/DD hh:mm:ss.SS A",
    "YYYY/MM/DD hh:mm:ss.SSS A",

    // ISO-like local date-time without timezone
    "YYYY-MM-DDTHH:mm",
    "YYYY-MM-DDTHH:mm:ss",
    "YYYY-MM-DDTHH:mm:ss.S",
    "YYYY-MM-DDTHH:mm:ss.SS",
    "YYYY-MM-DDTHH:mm:ss.SSS",
  ] as const;

  constructor(
    { date, time }: IUTCDateFormatterInput,
    {
      timeZone = UTCDateFormatter.DEFAULT_TIME_ZONE,
    }: IUTCDateFormatterOptions = {},
  ) {
    this.date = date;
    this.time = time?.trim() || undefined;
    this.timeZone = timeZone.trim();

    this.assertValidTimeZone();
    this.assertValidTime();

    /**
     * Parse once and reuse the same immutable Dayjs value in every method.
     */
    this.parsedDate = this.parseInput();
  }

  /**
   * Converts the parsed date-time into a UTC JavaScript Date.
   *
   * Example:
   * Input date: 2026-07-25
   * Input time: 20:40:30
   * Timezone:   Asia/Dhaka
   * Output:     2026-07-25T14:40:30.000Z
   */
  public formatUtc(): Date {
    return this.parsedDate.utc().toDate();
  }

  /**
   * Returns the parsed date-time as a UTC ISO string.
   */
  public formatUtcISOString(): string {
    return this.parsedDate.utc().toISOString();
  }

  /**
   * Returns a SQL-compatible UTC timestamp without a timezone suffix.
   *
   * Example:
   * 2026-07-25 14:40:30.000
   */
  public formatUtcTimestamp(): string {
    return this.parsedDate.utc().format("YYYY-MM-DD HH:mm:ss.SSS");
  }

  /**
   * Returns a formatted local date-time using the supplied timezone.
   */
  public formatLocal(format = "YYYY-MM-DD HH:mm:ss"): string {
    return this.parsedDate.tz(this.timeZone).format(format);
  }

  /**
   * Returns an ISO-like local date-time string including its UTC offset.
   *
   * Example:
   * 2026-07-25T20:40:30.000+06:00
   */
  public formatLocalISOString(): string {
    return this.parsedDate.tz(this.timeZone).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
  }

  /**
   * Returns the local date-time as a readable JavaScript string.
   *
   * Note: JavaScript Date itself does not store an IANA timezone.
   */
  public local(): string {
    return this.parsedDate.tz(this.timeZone).toDate().toString();
  }

  /**
   * Adds local calendar days while preserving the local wall-clock time.
   *
   * This is safer for DST-aware timezones than adding exactly 24 hours.
   */
  public addDaysUtc(days = 1): Date {
    this.assertInteger(days, "days");

    const result = this.addLocalCalendarDays(this.parsedDate, days);

    return result.utc().toDate();
  }

  /**
   * Adds hours to the current instant and returns a UTC Date.
   */
  public addHoursUtc(hours: number): Date {
    this.assertInteger(hours, "hours");

    return this.parsedDate.add(hours, "hour").utc().toDate();
  }

  /**
   * Adds minutes to the current instant and returns a UTC Date.
   */
  public addMinutesUtc(minutes: number): Date {
    this.assertInteger(minutes, "minutes");

    return this.parsedDate.add(minutes, "minute").utc().toDate();
  }

  /**
   * Returns the beginning of the local day converted to UTC.
   */
  public startOfDayUtc(): Date {
    return this.parsedDate.startOf("day").utc().toDate();
  }

  /**
   * Returns the end of the local day converted to UTC.
   *
   * For database filtering, an exclusive upper bound is generally safer.
   */
  public endOfDayUtc(): Date {
    return this.parsedDate.endOf("day").utc().toDate();
  }

  /**
   * Returns the start of the next local day converted to UTC.
   *
   * Recommended Mongoose range filter:
   * {
   *   $gte: formatter.startOfDayUtc(),
   *   $lt:  formatter.nextDayStartUtc(),
   * }
   */
  public nextDayStartUtc(): Date {
    const localStart = this.parsedDate.startOf("day");
    const nextDayStart = this.addLocalCalendarDays(localStart, 1).startOf(
      "day",
    );

    return nextDayStart.utc().toDate();
  }

  /**
   * Returns the complete local day's inclusive UTC range.
   *
   * Input time is ignored because this method targets the complete day.
   */
  public getUtcDayRange(): IUtcInclusiveDateRange {
    return {
      from: this.parsedDate.startOf("day").utc().toDate(),
      to: this.parsedDate.endOf("day").utc().toDate(),
    };
  }

  /**
   * Returns an inclusive UTC range from the input local day through the end
   * of the specified future local day.
   *
   * `days = 0` means only the input day.
   * `days = 1` means the input day plus the next day.
   */
  public getUtcRangeByDays(days: number): IUtcInclusiveDateRange {
    if (!Number.isInteger(days) || days < 0) {
      throw new TypeError("days must be an integer greater than or equal to 0");
    }

    const localStart = this.parsedDate.startOf("day");
    const localEnd = this.addLocalCalendarDays(localStart, days).endOf("day");

    return {
      from: localStart.utc().toDate(),
      to: localEnd.utc().toDate(),
    };
  }

  /**
   * Returns UTC as a `timestamp` string in `YYYY-MM-DD HH:mm:ss.SSS` form,
   * suitable for log lines and ad-hoc SQL dumps.
   *
   * Example:
   * 2026-07-25 14:40:30.000
   */
  public toSqlTimestampWithoutTimeZone(): string {
    const utcDate = this.parsedDate.utc().toDate();

    if (Number.isNaN(utcDate.getTime())) {
      throw new TypeError(
        "toSqlTimestampWithoutTimeZone received an invalid Date",
      );
    }

    return utcDate.toISOString().slice(0, 23).replace("T", " ");
  }

  /**
   * Parses Date, Unix timestamp, ISO instant, supported local date-time,
   * or a date-only value combined with a separate HH:mm:ss value.
   */
  private parseInput(): Dayjs {
    /**
     * A JavaScript Date represents an absolute instant.
     *
     * When a separate time is supplied, we first obtain the calendar date
     * in the requested timezone and replace its local wall-clock time.
     */
    if (this.date instanceof Date) {
      if (Number.isNaN(this.date.getTime())) {
        throw new TypeError("Invalid JavaScript Date value");
      }

      if (this.time) {
        const localDate = dayjs(this.date)
          .tz(this.timeZone)
          .format("YYYY-MM-DD");

        return this.parseCombinedDateAndTime(
          localDate,
          "YYYY-MM-DD",
          this.time,
        );
      }

      const parsedDate = dayjs(this.date).tz(this.timeZone);

      this.assertValidDate(parsedDate);

      return parsedDate;
    }

    if (typeof this.date !== "string") {
      throw new TypeError("Date value must be a string or JavaScript Date");
    }

    const value = this.date.trim();

    if (!value) {
      throw new TypeError("Date value cannot be empty");
    }

    /**
     * When `time` is provided, the date input must contain only a date.
     * Existing date-time or timezone-offset values are intentionally rejected
     * to avoid ambiguous replacement behavior.
     */
    if (this.time) {
      const dateOnlyFormat = this.detectDateOnlyFormat(value);

      if (!dateOnlyFormat) {
        throw new TypeError(
          [
            "Separate time can only be used with a date-only input.",
            'Supported date formats: "YYYY-MM-DD" and "YYYY/MM/DD".',
          ].join(" "),
        );
      }

      return this.parseCombinedDateAndTime(value, dateOnlyFormat, this.time);
    }

    /**
     * Unix timestamp string support.
     * 10 digits = seconds.
     * 13 digits = milliseconds.
     */
    if (/^\d{10}$/.test(value)) {
      const parsedDate = dayjs.unix(Number(value));

      this.assertValidDate(parsedDate);

      return parsedDate.tz(this.timeZone);
    }

    if (/^\d{13}$/.test(value)) {
      const parsedDate = dayjs(Number(value));

      this.assertValidDate(parsedDate);

      return parsedDate.tz(this.timeZone);
    }

    /**
     * A value with `Z` or a UTC offset already represents an absolute instant.
     */
    if (this.hasTimeZoneOffset(value)) {
      const parsedDate = dayjs(value);

      this.assertValidDate(parsedDate);

      return parsedDate.tz(this.timeZone);
    }

    /**
     * A value without an offset is treated as local wall-clock time in the
     * supplied IANA timezone.
     */
    const detectedFormat = this.detectInputFormat(value);
    const parsedDate = dayjs.tz(value, detectedFormat, this.timeZone);

    this.assertValidDate(parsedDate);

    return parsedDate;
  }

  /**
   * Combines a date-only value and HH:mm:ss time, then parses them as local
   * wall-clock time in the supplied timezone.
   */
  private parseCombinedDateAndTime(
    dateValue: string,
    dateFormat: string,
    timeValue: string,
  ): Dayjs {
    const combinedValue = `${dateValue} ${timeValue}`;
    const combinedFormat = `${dateFormat} ${UTCDateFormatter.TIME_FORMAT}`;

    const parsedDate = dayjs.tz(combinedValue, combinedFormat, this.timeZone);

    this.assertValidDate(parsedDate);

    return parsedDate;
  }

  /**
   * Detects whether a string is a supported date-only value.
   */
  private detectDateOnlyFormat(value: string): string | null {
    for (const format of UTCDateFormatter.SUPPORTED_DATE_ONLY_FORMATS) {
      const parsedDate = dayjs(value, format, true);

      if (parsedDate.isValid()) {
        return format;
      }
    }

    return null;
  }

  /**
   * Strictly detects one of the supported local input formats.
   */
  private detectInputFormat(value: string): string {
    for (const format of UTCDateFormatter.SUPPORTED_INPUT_FORMATS) {
      const parsedDate = dayjs(value, format, true);

      if (parsedDate.isValid()) {
        return format;
      }
    }

    throw new TypeError(
      [
        `Unsupported or invalid date value: "${value}".`,
        "Use ISO 8601, Unix timestamp, JavaScript Date,",
        "or one of the supported application date formats.",
      ].join(" "),
    );
  }

  /**
   * Checks whether an input ends with UTC `Z` or an explicit UTC offset.
   */
  private hasTimeZoneOffset(value: string): boolean {
    return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  }

  /**
   * Adds local calendar days while recalculating the timezone offset.
   * This preserves local wall-clock time across DST transitions.
   */
  private addLocalCalendarDays(date: Dayjs, days: number): Dayjs {
    const targetLocalDateTime = date
      .tz(this.timeZone)
      .add(days, "day")
      .format("YYYY-MM-DD HH:mm:ss.SSS");

    return dayjs.tz(
      targetLocalDateTime,
      "YYYY-MM-DD HH:mm:ss.SSS",
      this.timeZone,
    );
  }

  /**
   * Validates the optional separate time.
   * Accepted format: 24-hour HH:mm:ss.
   */
  private assertValidTime(): void {
    if (!this.time) {
      return;
    }

    const parsedTime = dayjs(this.time, UTCDateFormatter.TIME_FORMAT, true);

    if (!parsedTime.isValid()) {
      throw new TypeError(
        `Invalid time value: "${this.time}". Expected format: HH:mm:ss`,
      );
    }
  }

  /**
   * Validates the supplied IANA timezone.
   */
  private assertValidTimeZone(): void {
    if (!this.timeZone) {
      throw new TypeError("Timezone cannot be empty");
    }

    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone: this.timeZone,
      }).format();
    } catch {
      throw new TypeError(`Invalid IANA timezone: ${this.timeZone}`);
    }
  }

  /**
   * Ensures a numeric operation receives an integer.
   */
  private assertInteger(value: number, fieldName: string): void {
    if (!Number.isInteger(value)) {
      throw new TypeError(`${fieldName} must be an integer`);
    }
  }

  /**
   * Ensures the parsed Dayjs value is valid.
   */
  private assertValidDate(parsedDate: Dayjs): void {
    if (!parsedDate.isValid()) {
      throw new TypeError(`Invalid date value: ${String(this.date)}`);
    }
  }
}

/* =========================================================
   Shared date-range helper
   ========================================================= */

/**
 * Input accepted by createUtcDateRange.
 *
 * `from` is required.  `to` is optional; when omitted the range covers
 * the same local calendar day as `from`.
 */
export type LocalDateRangeInput = {
  from: string;
  to?: string;
  timeZone: string;
};

/**
 * Converts a local calendar date range (YYYY-MM-DD strings) into an
 * inclusive UTC range object that slots straight into a Mongoose
 * `FilterQuery` (or any other DB filter using `$gte` / `$lte`).
 *
 * Rule 1 — single date:
 *   from = "2026-07-22", timeZone = "Asia/Dhaka"
 *   → gte: 2026-07-21T18:00:00.000Z  (start of day in Dhaka)
 *   → lte: 2026-07-22T17:59:59.999Z  (end of day in Dhaka)
 *
 * Rule 2 — date range:
 *   from = "2026-07-22", to = "2026-07-29", timeZone = "Asia/Dhaka"
 *   → gte: start of July 22 in Dhaka, converted to UTC
 *   → lte: end   of July 29 in Dhaka, converted to UTC
 *
 * Usage:
 *   filter.createdAt = createUtcDateRange({ from, to, timeZone });
 */
export const createUtcDateRange = ({
  from,
  to,
  timeZone,
}: LocalDateRangeInput): { gte: Date; lte: Date } => {
  const fromDate = new UTCDateFormatter({ date: from }, { timeZone });
  const toDate = new UTCDateFormatter({ date: to ?? from }, { timeZone });

  return {
    gte: fromDate.startOfDayUtc(),
    lte: toDate.endOfDayUtc(),
  };
};
