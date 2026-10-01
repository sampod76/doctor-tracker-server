export type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

/**
 * IPaginationResult — concrete pagination state after defaults has been applied.
 * `IPaginationOptions` keeps the inputs optional because callers may pass
 * partial values; the result narrows them to required `number` / `string`
 * so Mongoose `.skip()` / `.limit()` calls don't see `undefined`.
 */
export type IPaginationResult = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};