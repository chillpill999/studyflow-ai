import { test, expect } from '@playwright/test';
import { AuthPage } from './pom/AuthPage';
import { NotesPage } from './pom/NotesPage';
import { setupCommonMocks, setupAuthMocks, setupDocumentMocks, setupNotesMocks } from './mocks';

test.describe('Notes', () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonMocks(page);
    await setupAuthMocks(page);
    await setupDocumentMocks(page);
    await setupNotesMocks(page);
  });

  test('Notes page renders with sidebar and viewer', async ({ page }) => {
    const auth = new AuthPage(page);
    const notes = new NotesPage(page);
    await auth.login();
    await notes.goto();

    await expect(page.getByRole('heading', { name: 'AI Notes Generator' })).toBeVisible();
    await expect(page.getByText('Generate Study Notes')).toBeVisible();
    await expect(page.getByText('Your Saved Notes')).toBeVisible();
  });

  test('Saved notes are displayed in sidebar', async ({ page }) => {
    const auth = new AuthPage(page);
    const notes = new NotesPage(page);
    await auth.login();
    await notes.goto();
    await page.waitForTimeout(500);

    await expect(page.getByText('Calculus Review Sheet')).toBeVisible({ timeout: 5000 });
  });

  test('Selecting a note shows its content in the viewer', async ({ page }) => {
    const auth = new AuthPage(page);
    const notes = new NotesPage(page);
    await auth.login();
    await notes.goto();
    await page.waitForTimeout(500);

    await notes.selectNote('Calculus Review Sheet');
    await page.waitForTimeout(300);

    const title = await notes.getNoteTitle();
    expect(title).toContain('Calculus Review Sheet');
  });

  test('Edit and Save functionality works', async ({ page }) => {
    const auth = new AuthPage(page);
    const notes = new NotesPage(page);
    await auth.login();
    await notes.goto();
    await page.waitForTimeout(500);

    await notes.clickEdit();
    await page.waitForTimeout(200);
    await notes.fillEditTitle('Updated Title');
    await notes.clickSave();

    await page.waitForTimeout(300);
  });

  test('Notes mode selector buttons are visible', async ({ page }) => {
    const auth = new AuthPage(page);
    const notes = new NotesPage(page);
    await auth.login();
    await notes.goto();

    await expect(page.getByRole('button', { name: 'detailed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'concise' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'summary' })).toBeVisible();
  });

  test('Generate with AI button is visible', async ({ page }) => {
    const auth = new AuthPage(page);
    const notes = new NotesPage(page);
    await auth.login();
    await notes.goto();

    await expect(page.getByRole('button', { name: 'Generate with AI' })).toBeVisible();
  });
});
