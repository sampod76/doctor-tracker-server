export type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type IPaginationResult = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};
