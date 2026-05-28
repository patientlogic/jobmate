/**
 * Loads .env / .env.local and sets DATABASE_URL from split DATABASE_* vars when needed.
 * Used before Prisma CLI (see with-database-url.cjs).
 */

const path = require("path");
const root = path.resolve(__dirname, "..");

require("dotenv").config({ path: path.join(root, ".env") });
require("dotenv").config({ path: path.join(root, ".env.local"), override: true });

let url = (process.env.DATABASE_URL ?? "").trim();

if (!url) {
  const host = (process.env.DATABASE_HOST ?? "").trim();
  const port = (process.env.DATABASE_PORT ?? "").trim() || "3306";
  const user = (process.env.DATABASE_USER ?? "").trim();
  const password = process.env.DATABASE_PASSWORD ?? "";
  const name = (process.env.DATABASE_NAME ?? "").trim();

  if (host && user && name) {
    url = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
  }
}

if (url) {
  process.env.DATABASE_URL = url;
}
