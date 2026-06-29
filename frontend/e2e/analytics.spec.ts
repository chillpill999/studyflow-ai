import { test, expect } from '@playwright/test';
import { AuthPage } from './pom/AuthPage';
import { AnalyticsPage } from './pom/AnalyticsPage';
import { setupCommonMocks, setupAuthMocks, setupAnalyticsMocks } from './mocks';

test.describe('Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonMocks(page);
    await setupAuthMocks(page);
    await setupAnalyticsMocks(page);
  });

  test('Analytics page renders with metrics', async ({ page }) => {
    const auth = new AuthPage(page);
    const analytics = new AnalyticsPage(page);
    await auth.login();
    await analytics.goto();

    await expect(page.getByRole('heading', { name: 'Learning Analytics' })).toBeVisible();
    await expect(page.getByText('Study Streak')).toBeVisible();
    await expect(page.getByText('Total Study Duration')).toBeVisible();
    await expect(page.getByText('Average Quiz Accuracy')).toBeVisible();
    await expect(page.getByText('Spaced Repetition Cards')).toBeVisible();
  });

  test('AI Study Coach section is visible', async ({ page }) => {
    const auth = new AuthPage(page);
    const analytics = new AnalyticsPage(page);
    await auth.login();
    await analytics.goto();

    const coachVisible = await analytics.isCoachRecommendationVisible();
    expect(coachVisible).toBeTruthy();
  });

  test('Log Study Session modal opens and logs', async ({ page }) => {
    const auth = new AuthPage(page);
    const analytics = new AnalyticsPage(page);
    await auth.login();
    await analytics.goto();
    await page.waitForTimeout(500);

    await analytics.clickLogStudySession();
    await expect(page.getByText('Log Study Session')).toBeVisible();

    await analytics.selectActivity('Reading Book / Notes');
    await analytics.setDuration('30');
    await analytics.clickLogSession();

    await page.waitForTimeout(300);
  });

  test('Streak value is displayed correctly', async ({ page }) => {
    const auth = new AuthPage(page);
    const analytics = new AnalyticsPage(page);
    await auth.login();
    await analytics.goto();
    await page.waitForTimeout(500);

    const streak = await analytics.getStreakValue();
    expect(streak).toContain('8');
  });

  test('Activity distribution section is visible', async ({ page }) => {
    const auth = new AuthPage(page);
    const analytics = new AnalyticsPage(page);
    await auth.login();
    await analytics.goto();

    await expect(page.getByText('Activity Distribution')).toBeVisible();
    await expect(page.getByText('Leitner Box Distribution')).toBeVisible();
  });
});
