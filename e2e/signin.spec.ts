import { test, expect } from "@playwright/test";
import { getAppUrl } from "../config/getAppUrl";
import { APP_NAME } from "../config/app-name";

getAppUrl();

test("Signin page has title", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(`Sign In | ${APP_NAME}`);

  await expect(page.getByRole("heading", { name: APP_NAME })).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});

test("Signin and out from app", async ({ page, baseURL }) => {
  await page.goto("/");
  await page.getByPlaceholder("id@example.com").click();
  await page.getByPlaceholder("id@example.com").fill("admin@example.com");
  await page.getByLabel("Password").click();
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(baseURL + "/dashboard");

  await page.getByRole("button", { name: "Avatar" }).click();
  await page.getByRole("button", { name: "Logout" }).click();

  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});
