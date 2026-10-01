const DURATION_PATTERN = /^(\d+)(ms|s|m|h|d|w)$/;

const UNIT_TO_MILLISECONDS = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
} as const;

type DurationUnit = keyof typeof UNIT_TO_MILLISECONDS;

const isDurationUnit = (value: string): value is DurationUnit => {
  return Object.prototype.hasOwnProperty.call(UNIT_TO_MILLISECONDS, value);
};

export const parseDurationToMilliseconds = (
  configuredExpiry: string,
  fieldName: string,
): number => {
  const normalized = configuredExpiry.trim();

  if (!normalized) {
    throw new Error(`${fieldName} must be configured`);
  }

  const match = DURATION_PATTERN.exec(normalized);

  if (!match) {
    throw new Error(`${fieldName} has an invalid duration: ${normalized}`);
  }

  const amount = Number(match[1]);
  const normalizedUnit = match[2];

  if (!isDurationUnit(normalizedUnit)) {
    throw new Error(`${fieldName} has an unsupported duration unit`);
  }

  const unit = normalizedUnit;
  const milliseconds = amount * UNIT_TO_MILLISECONDS[unit];

  if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0) {
    throw new Error(`${fieldName} duration must be a positive safe integer`);
  }

  return milliseconds;
};

export const parseJwtExpiryMilliseconds = (
  configuredExpiry: string,
): number => {
  return parseDurationToMilliseconds(configuredExpiry, "JWT expiration");
};

export const getJwtExpiryMilliseconds = parseJwtExpiryMilliseconds;

export const getJwtExpirySeconds = (configuredExpiry: string): number => {
  return Math.ceil(parseJwtExpiryMilliseconds(configuredExpiry) / 1_000);
};

export const getJwtExpiryDate = (
  configuredExpiry: string,
  from: Date = new Date(),
): Date => {
  return new Date(
    from.getTime() + parseJwtExpiryMilliseconds(configuredExpiry),
  );
};

export const jwtTimestampSecondsToDate = (timestampSeconds: number): Date => {
  if (!Number.isSafeInteger(timestampSeconds) || timestampSeconds < 0) {
    throw new Error("JWT timestamp must be a non-negative integer in seconds");
  }

  return new Date(timestampSeconds * 1_000);
};
