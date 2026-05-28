/**
 * Builds process.env.DATABASE_URL from DATABASE_HOST / DATABASE_USER / etc.
 * when DATABASE_URL is unset or empty. Prisma and @prisma/client read DATABASE_URL only.
 */
export function ensureDatabaseUrl(): void {
  const existing = process.env.DATABASE_URL?.trim();
  if (existing) return;

  const host = process.env.DATABASE_HOST?.trim();
  const port = process.env.DATABASE_PORT?.trim() || "3306";
  const user = process.env.DATABASE_USER?.trim();
  const password = process.env.DATABASE_PASSWORD ?? "";
  const name = process.env.DATABASE_NAME?.trim();

  if (!host || !user || !name) return;

  process.env.DATABASE_URL = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
}
