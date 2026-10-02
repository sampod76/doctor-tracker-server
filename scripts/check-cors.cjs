/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");

async function main() {
  const baseUrl = process.argv[2];
  if (!baseUrl)
    throw new Error("Usage: node scripts/check-cors.cjs <API base URL>");

  const origin = "https://doctor-tracker.iblossomlearn.org";
  const response = await fetch(new URL("/api/v1/auth/login", baseUrl), {
    method: "OPTIONS",
    redirect: "manual",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,authorization",
    },
    signal: AbortSignal.timeout(15000),
  });

  assert.equal(
    response.status,
    204,
    `Preflight returned HTTP ${response.status}`,
  );
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.equal(
    response.headers.get("access-control-allow-credentials"),
    "true",
  );
  assert.ok(
    response.headers
      .get("access-control-allow-methods")
      ?.split(/\s*,\s*/)
      .includes("POST"),
    "Preflight must allow POST",
  );
  const allowedHeaders =
    response.headers
      .get("access-control-allow-headers")
      ?.toLowerCase()
      .split(/\s*,\s*/) || [];
  for (const header of ["content-type", "authorization"]) {
    assert.ok(
      allowedHeaders.includes(header),
      `Preflight must allow ${header}`,
    );
  }
  console.log(`CORS preflight passed: ${baseUrl} allows ${origin}`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
