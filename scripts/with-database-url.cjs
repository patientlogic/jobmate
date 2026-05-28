#!/usr/bin/env node
require("./compose-database-url.cjs");

const { spawnSync } = require("child_process");

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: node scripts/with-database-url.cjs <prisma-args...>");
  console.error('Example: node scripts/with-database-url.cjs migrate dev');
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
