import "dotenv/config";
import { defineConfig } from "prisma/config";
import {
  buildDatabaseUrl,
  ensureDatabaseUrl,
} from "./config/database-url.js";

ensureDatabaseUrl();

const url = buildDatabaseUrl();

if (!url) {
  throw new Error(
    "Database connection is not configured. Set DATABASE_HOST, DATABASE_USER, DATABASE_NAME (and optionally DATABASE_PORT, DATABASE_PASSWORD), or set DATABASE_URL.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
