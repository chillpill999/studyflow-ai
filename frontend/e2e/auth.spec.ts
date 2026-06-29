import { test, expect } from '@playwright/test';
import { AuthPage } from './pom/AuthPage';
import { setupCommonMocks, setupAuthMocks } from './mocks';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonMocks(page);
    await setupAuthMocks(page);
  });

  test('Login page renders correctly', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();

    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByPlaceholder('you@domain.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByText('Forgot Password?')).toBeVisible();
  });

  test('Register page renders correctly', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoRegister();

    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    await expect(page.getByPlaceholder('you@domain.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });

  test('Forgot password page renders correctly', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoForgotPassword();

    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
    await expect(page.getByPlaceholder('you@domain.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Sign In' })).toBeVisible();
  });

  test('Successful login redirects to dashboard', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('text=Welcome back').first()).toBeVisible({ timeout: 5000 });
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid email or password' }),
      });
    });

    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await auth.fillEmail('wrong@email.com');
    await auth.fillPassword('wrongpassword');
    await auth.clickSignIn();

    await expect(page.locator('text=Invalid email or password').or(page.locator('[class*="text-red-700"]'))).toBeVisible({ timeout: 5000 });
  });

  test('Successful registration shows success message or redirects', async ({ page }) => {
    await page.route('**/auth/v1/signup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { user: { id: 'new-user', email: 'new@test.com' }, session: null },
        }),
      });
    });

    const auth = new AuthPage(page);
    await auth.register('New Student', 'new@test.com', 'password123');

    await expect(page.locator('text=check your email').or(page.locator('text=Welcome back'))).toBeVisible({ timeout: 5000 });
  });

  test('Logout redirects to login page', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('text=Welcome back').first()).toBeVisible({ timeout: 5000 });

    await auth.logout();
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });
});
