import { test, expect } from '@playwright/test';
import { AuthPage } from './pom/AuthPage';
import { DashboardPage } from './pom/DashboardPage';
import { setupCommonMocks, setupAuthMocks, setupDocumentMocks } from './mocks';

test.describe('PDF Upload', () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonMocks(page);
    await setupAuthMocks(page);
    await setupDocumentMocks(page);
  });

  test('Upload section is visible on dashboard', async ({ page }) => {
    const auth = new AuthPage(page);
    const dashboard = new DashboardPage(page);
    await auth.login();
    await dashboard.waitForDashboardLoad();

    await expect(page.getByText('Upload Documents')).toBeVisible();
    await expect(page.getByText('Drag & Drop PDF Syllabus')).toBeVisible();
  });

  test('Uploading a PDF shows it in the document list', async ({ page }) => {
    const auth = new AuthPage(page);
    const dashboard = new DashboardPage(page);
    await auth.login();
    await dashboard.waitForDashboardLoad();

    await dashboard.uploadFile('test-syllabus.pdf', 'Fake PDF content for testing');

    await expect(page.locator('text=Introduction to Algorithms.pdf')).toBeVisible({ timeout: 5000 });
  });

  test('Upload shows progress states', async ({ page }) => {
    const auth = new AuthPage(page);
    const dashboard = new DashboardPage(page);
    await auth.login();
    await dashboard.waitForDashboardLoad();

    await dashboard.uploadFile('test-progress.pdf', 'PDF content');

    await expect(page.locator('text=Uploading Status')).toBeVisible({ timeout: 5000 });
  });

  test('Document list shows existing documents', async ({ page }) => {
    const auth = new AuthPage(page);
    const dashboard = new DashboardPage(page);
    await auth.login();
    await dashboard.waitForDashboardLoad();

    await expect(page.locator('text=Introduction to Algorithms.pdf')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Calculus Overview.pdf')).toBeVisible({ timeout: 5000 });
  });

  test('Chat RAG button navigates to chat with doc context', async ({ page }) => {
    const auth = new AuthPage(page);
    const dashboard = new DashboardPage(page);
    await auth.login();
    await dashboard.waitForDashboardLoad();

    await dashboard.clickChatRAG();

    await expect(page).toHaveURL(/\/dashboard\/chat/, { timeout: 10000 });
  });
});
