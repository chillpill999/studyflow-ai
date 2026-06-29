import { Page } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}

  async gotoLogin(): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForSelector('h1:has-text("Welcome Back")');
  }

  async gotoRegister(): Promise<void> {
    await this.page.goto('/register');
    await this.page.waitForSelector('h1:has-text("Create Account")');
  }

  async gotoForgotPassword(): Promise<void> {
    await this.page.goto('/forgot-password');
    await this.page.waitForSelector('h1:has-text("Reset Password")');
  }

  async fillEmail(email: string): Promise<void> {
    await this.page.getByPlaceholder('you@domain.com').fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.getByPlaceholder('••••••••').fill(password);
  }

  async fillFullName(name: string): Promise<void> {
    await this.page.getByPlaceholder('John Doe').fill(name);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    const inputs = this.page.getByPlaceholder('••••••••');
    await inputs.nth(1).fill(password);
  }

  async clickSignIn(): Promise<void> {
    await this.page.getByRole('button', { name: 'Sign In' }).click();
  }

  async clickCreateAccount(): Promise<void> {
    await this.page.getByRole('button', { name: 'Create Account' }).click();
  }

  async clickSendResetLink(): Promise<void> {
    await this.page.getByRole('button', { name: 'Send Reset Link' }).click();
  }

  async clickGoogleSignIn(): Promise<void> {
    await this.page.getByRole('button', { name: /Sign in with Google|Sign up with Google/ }).click();
  }

  async clickSignOut(): Promise<void> {
    await this.page.getByRole('button', { name: 'Sign Out' }).click();
  }

  async isLoggedIn(): Promise<boolean> {
    return this.page.locator('text=Welcome back').first().isVisible().catch(() => false);
  }

  async isOnLoginPage(): Promise<boolean> {
    return this.page.getByRole('heading', { name: 'Welcome Back' }).isVisible().catch(() => false);
  }

  async login(email = 'test@thestudyflow.com', password = 'password123'): Promise<void> {
    await this.gotoLogin();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
  }

  async register(fullName = 'Test Student', email = 'test@thestudyflow.com', password = 'password123'): Promise<void> {
    await this.gotoRegister();
    await this.fillFullName(fullName);
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(password);
    await this.clickCreateAccount();
  }

  async logout(): Promise<void> {
    await this.clickSignOut();
  }
}
