// utils/EndPointBuilder.ts

import { Request } from "express";

export class EndPointBuilder {
  private basePath: string;
  private pathParams: Record<string, string | number>;
  private queryParams: Record<string, string | number>;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.pathParams = {};
    this.queryParams = {};
  }

  setPathParams(params: Record<string, string | number>) {
    this.pathParams = params;

    return this;
  }

  setQueryParams(params: Request["query"]) {
    const normalized: Record<string, string | number> = {};

    for (const key in params) {
      const value = params[key];
      if (typeof value === "string" || typeof value === "number") {
        normalized[key] = value;
      } else if (Array.isArray(value)) {
        normalized[key] = value[0]?.toString() ?? "";
      } else if (value !== undefined && value !== null) {
        normalized[key] = String(value);
      }
    }

    this.queryParams = normalized;
    return this;
  }

  build(): string {
    let path = this.basePath;

    for (const [key, value] of Object.entries(this.pathParams)) {
      path = path.replace(
        new RegExp(`:${key}`, "g"),
        encodeURIComponent(String(value)),
      );
    }

    const queryString = new URLSearchParams(
      this.queryParams as Record<string, string>,
    ).toString();
    return queryString ? `${path}?${queryString}` : path;
  }
}

// Usage:
// const urlBuilder = new UrlBuilder("/api/users/:userId");
// const url = urlBuilder
//   .setPathParams({ userId: 123 })
//   .setQueryParams({ page: 1, limit: 10 })
//   .build();
// console.log(url); // Output: /api/users/123?page=1&limit=10
