/**
 * config/index.ts — single import surface for everything config-shaped.
 *
 * Usage:
 *   import config from "@app/config";
 *   config.env.PORT
 */
import { env } from "./env";
import { corsOptions } from "./corsOptions";
import { helmetConfig } from "./helmetConfig";

const config = {
  env,
  corsOptions,
  helmetConfig,
};

export default config;
export { env, corsOptions, helmetConfig };
export * from "./database";
