/**
 * Build MySQL connection URL from DATABASE_HOST / DATABASE_USER / etc.
 * DATABASE_URL is optional; when set it takes precedence.
 */

function buildDatabaseUrl(env = process.env) {
  const existing = env.DATABASE_URL?.trim();
  if (existing) return existing;

  const host = env.DATABASE_HOST?.trim();
  const port = env.DATABASE_PORT?.trim() || "3306";
  const user = env.DATABASE_USER?.trim();
  const password = env.DATABASE_PASSWORD ?? "";
  const name = env.DATABASE_NAME?.trim();

  if (!host || !user || !name) return undefined;

  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
}

function ensureDatabaseUrl(env = process.env) {
  const url = buildDatabaseUrl(env);
  if (url) {
    env.DATABASE_URL = url;
  }
}

module.exports = { buildDatabaseUrl, ensureDatabaseUrl };
