export type SessionExpiry = {
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  expiresAt: Date;
};

export type LoginSessionExpirations = SessionExpiry;

const addMilliseconds = (from: Date, milliseconds: number): Date => {
  return new Date(from.getTime() + milliseconds);
};

const earlierDate = (first: Date, second: Date): Date => {
  return first.getTime() < second.getTime() ? first : second;
};

export const calculateLoginSessionExpirations = (
  now: Date,
  absoluteLifetimeMilliseconds: number,
  idleLifetimeMilliseconds: number,
): LoginSessionExpirations => {
  const absoluteExpiresAt = addMilliseconds(now, absoluteLifetimeMilliseconds);
  const requestedIdleExpiresAt = addMilliseconds(now, idleLifetimeMilliseconds);

  return {
    absoluteExpiresAt,
    idleExpiresAt: earlierDate(requestedIdleExpiresAt, absoluteExpiresAt),
    expiresAt: earlierDate(requestedIdleExpiresAt, absoluteExpiresAt),
  };
};

export const calculateNextIdleExpiration = (
  now: Date,
  idleLifetimeMilliseconds: number,
  absoluteExpiresAt: Date,
): Date => {
  const requestedIdleExpiresAt = addMilliseconds(now, idleLifetimeMilliseconds);
  return earlierDate(requestedIdleExpiresAt, absoluteExpiresAt);
};

export const calculateRemainingSeconds = (
  expiresAt: Date,
  now: Date = new Date(),
): number => {
  const expiresAtSeconds = Math.floor(expiresAt.getTime() / 1_000);
  const nowInSeconds = Math.floor(now.getTime() / 1_000);

  return expiresAtSeconds - nowInSeconds;
};
