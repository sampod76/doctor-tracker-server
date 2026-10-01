/* eslint-disable @typescript-eslint/no-require-imports */

const { execSync } = require("child_process");
const { existsSync, rmSync } = require("fs");

// Step 1: Clean previous dist
rmSync("dist", { recursive: true, force: true });

// Step 2: Transpile TypeScript with Babel directly into dist/
process.env.NODE_ENV = "production";
execSync('pnpm babel src --extensions ".ts" --out-dir dist', {
  stdio: "inherit",
});

// Step 3: Set Babel output entry file
const entryFile = "dist/server.js"; // <- output goes directly here

if (!existsSync(entryFile)) {
  throw new Error(`Compiled file not found: ${entryFile}`);
}

// Step 4: Minify using Terser into same location (overwrite)
execSync(
  `pnpm terser ${entryFile} --compress drop_console=true,pure_funcs=["console.log","console.debug"] --mangle --output dist/server.js`,
  { stdio: "inherit" },
);
