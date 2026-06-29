import { test, expect } from '@playwright/test';
import { AuthPage } from './pom/AuthPage';
import { MindmapPage } from './pom/MindmapPage';
import { setupCommonMocks, setupAuthMocks, setupDocumentMocks, setupMindmapMocks } from './mocks';

test.describe('Mind Map', () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonMocks(page);
    await setupAuthMocks(page);
    await setupDocumentMocks(page);
    await setupMindmapMocks(page);
  });

  test('Mindmap page renders with placeholder state', async ({ page }) => {
    const auth = new AuthPage(page);
    const mindmap = new MindmapPage(page);
    await auth.login();
    await mindmap.goto();

    await expect(page.getByRole('heading', { name: 'Interactive Concept Map' })).toBeVisible();
    await expect(page.getByText('Select Source')).toBeVisible();
  });

  test('Generate Concept Map button is visible', async ({ page }) => {
    const auth = new AuthPage(page);
    const mindmap = new MindmapPage(page);
    await auth.login();
    await mindmap.goto();

    await expect(page.getByRole('button', { name: 'Generate Concept Map' })).toBeVisible();
  });

  test('Document selector is visible', async ({ page }) => {
    const auth = new AuthPage(page);
    const mindmap = new MindmapPage(page);
    await auth.login();
    await mindmap.goto();

    await expect(page.locator('select').first()).toBeVisible();
  });

  test('Generating mindmap shows nodes in graph', async ({ page }) => {
    const auth = new AuthPage(page);
    const mindmap = new MindmapPage(page);
    await auth.login();
    await mindmap.goto();
    await page.waitForTimeout(300);

    await mindmap.selectDocument('Introduction to Algorithms.pdf');
    await mindmap.clickGenerate();
    await page.waitForTimeout(500);

    const graphVisible = await mindmap.isGraphVisible();
    expect(graphVisible).toBeTruthy();
  });

  test('Export buttons appear after graph generation', async ({ page }) => {
    const auth = new AuthPage(page);
    const mindmap = new MindmapPage(page);
    await auth.login();
    await mindmap.goto();
    await page.waitForTimeout(300);

    await mindmap.selectDocument('Introduction to Algorithms.pdf');
    await mindmap.clickGenerate();
    await page.waitForTimeout(500);

    await expect(page.getByRole('button', { name: 'JSON' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'SVG' })).toBeVisible();
  });
});
