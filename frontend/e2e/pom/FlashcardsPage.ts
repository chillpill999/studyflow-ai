import { Page } from '@playwright/test';

export class FlashcardsPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/flashcards');
    await this.page.waitForSelector('text=AI Flashcard Review');
  }

  async selectDocument(docName: string): Promise<void> {
    await this.page.locator('select').first().selectOption({ label: docName });
  }

  async clickGenerate(): Promise<void> {
    await this.page.getByRole('button', { name: 'Generate with AI' }).click();
  }

  async flipCard(): Promise<void> {
    await this.page.locator('[class*="cursor-pointer"]').first().click();
  }

  async clickForgot(): Promise<void> {
    await this.page.getByRole('button', { name: /Forgot/ }).click();
  }

  async clickRemembered(): Promise<void> {
    await this.page.getByRole('button', { name: /Remembered/ }).click();
  }

  async switchToManageDeck(): Promise<void> {
    await this.page.getByRole('button', { name: 'Manage Deck' }).click();
  }

  async switchToReviewDeck(): Promise<void> {
    await this.page.getByRole('button', { name: 'Review Deck' }).click();
  }

  async getCardFront(): Promise<string> {
    const text = await this.page.locator('text=Question / Term').locator('..').locator('[class*="text-lg"]').textContent();
    return text ?? '';
  }

  async getCardBack(): Promise<string> {
    const text = await this.page.locator('text=Answer / Concept').locator('..').locator('[class*="text-md"]').textContent();
    return text ?? '';
  }

  async isCardVisible(): Promise<boolean> {
    return this.page.locator('text=Question / Term').isVisible().catch(() => false);
  }

  async isAllCaughtUp(): Promise<boolean> {
    return this.page.locator('text=All caught up!').isVisible().catch(() => false);
  }
}
