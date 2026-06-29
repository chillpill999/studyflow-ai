import { test, expect } from '@playwright/test';
import { AuthPage } from './pom/AuthPage';
import { FlashcardsPage } from './pom/FlashcardsPage';
import { setupCommonMocks, setupAuthMocks, setupDocumentMocks, setupFlashcardMocks } from './mocks';

test.describe('Flashcards', () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonMocks(page);
    await setupAuthMocks(page);
    await setupDocumentMocks(page);
    await setupFlashcardMocks(page);
  });

  test('Flashcards page renders with review deck', async ({ page }) => {
    const auth = new AuthPage(page);
    const flashcards = new FlashcardsPage(page);
    await auth.login();
    await flashcards.goto();

    await expect(page.getByRole('heading', { name: 'AI Flashcard Review' })).toBeVisible();
    await expect(page.getByText('Configure Deck')).toBeVisible();
  });

  test('Review mode shows flashcard with flip interaction', async ({ page }) => {
    const auth = new AuthPage(page);
    const flashcards = new FlashcardsPage(page);
    await auth.login();
    await flashcards.goto();
    await page.waitForTimeout(500);

    const isCaughtUp = await flashcards.isAllCaughtUp();
    if (!isCaughtUp) {
      await expect(page.getByText('Question / Term')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Click to flip card')).toBeVisible();
    }
  });

  test('Manage deck view shows card list', async ({ page }) => {
    const auth = new AuthPage(page);
    const flashcards = new FlashcardsPage(page);
    await auth.login();
    await flashcards.goto();
    await page.waitForTimeout(500);

    await flashcards.switchToManageDeck();
    await page.waitForTimeout(300);

    await expect(page.getByText('Manage Active Flashcards')).toBeVisible();
  });

  test('Generate with AI button is visible', async ({ page }) => {
    const auth = new AuthPage(page);
    const flashcards = new FlashcardsPage(page);
    await auth.login();
    await flashcards.goto();

    await expect(page.getByRole('button', { name: 'Generate with AI' })).toBeVisible();
  });

  test('Export and Import buttons are visible', async ({ page }) => {
    const auth = new AuthPage(page);
    const flashcards = new FlashcardsPage(page);
    await auth.login();
    await flashcards.goto();

    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();
  });
});
