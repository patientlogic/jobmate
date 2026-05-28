import dotenv from "dotenv";
import path from "path";

const root = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, ".env.local"), override: true });

const DEFAULT_APP_URL = "http://localhost:3737";

/** App origin from APP_URL, NEXTAUTH_URL, or default (no trailing slash). */
export function getAppUrl(): string {
  const fromEnv =
    process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  return (fromEnv || DEFAULT_APP_URL).replace(/\/$/, "");
}
