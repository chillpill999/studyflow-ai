import { Page } from '@playwright/test';

export class AnalyticsPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/analytics');
    await this.page.waitForSelector('text=Learning Analytics');
  }

  async clickLogStudySession(): Promise<void> {
    await this.page.getByRole('button', { name: 'Log Study Session' }).click();
  }

  async selectActivity(activity: string): Promise<void> {
    await this.page.locator('select').first().selectOption({ label: activity });
  }

  async setDuration(minutes: string): Promise<void> {
    await this.page.locator('input[type="number"]').fill(minutes);
  }

  async clickLogSession(): Promise<void> {
    await this.page.getByRole('button', { name: 'Log Session' }).click();
  }

  async isStudyStreakVisible(): Promise<boolean> {
    return this.page.locator('text=Study Streak').isVisible().catch(() => false);
  }

  async getStreakValue(): Promise<string> {
    const text = await this.page.locator('text=Study Streak').locator('..').locator('[class*="text-2xl"]').textContent();
    return text ?? '';
  }

  async isCoachRecommendationVisible(): Promise<boolean> {
    return this.page.locator('text=AI Study Coach').isVisible().catch(() => false);
  }
}
