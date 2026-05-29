/** Display name from APP_NAME (.env). Exposed to the client as NEXT_PUBLIC_APP_NAME via next.config.mjs */
export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ??
  process.env.APP_NAME ??
  "DreamJob | Alison IT Center";

export function withAppName(pageTitle: string): string {
  return `${pageTitle} | ${APP_NAME}`;
}
