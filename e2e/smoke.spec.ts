import { test, expect } from "@playwright/test";

test.describe("公開ページ", () => {
  test("未ログイン時トップはログインへリダイレクト", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveTitle(/スローライフ/);
  });

  test("ログインページが表示される", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "スローライフ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
  });

  test("新規登録ページが表示される", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "新規登録" })).toBeVisible();
    await expect(page.getByRole("button", { name: "アカウント作成" })).toBeVisible();
  });
});
