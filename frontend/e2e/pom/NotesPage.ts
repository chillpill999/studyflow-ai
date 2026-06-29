import { Page } from '@playwright/test';

export class NotesPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/notes');
    await this.page.waitForSelector('text=AI Notes Generator');
  }

  async selectDocument(docName: string): Promise<void> {
    await this.page.locator('select').first().selectOption({ label: docName });
  }

  async selectMode(mode: 'detailed' | 'concise' | 'summary'): Promise<void> {
    await this.page.getByRole('button', { name: mode }).click();
  }

  async clickGenerate(): Promise<void> {
    await this.page.getByRole('button', { name: 'Generate with AI' }).click();
  }

  async selectNote(title: string): Promise<void> {
    await this.page.locator(`text=${title}`).first().click();
  }

  async clickEdit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Edit' }).click();
  }

  async clickSave(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async clickCopy(): Promise<void> {
    await this.page.getByRole('button', { name: /Copy/ }).click();
  }

  async clickExport(): Promise<void> {
    await this.page.getByRole('button', { name: 'Export' }).click();
  }

  async fillEditTitle(title: string): Promise<void> {
    const input = this.page.locator('input[type="text"]').first();
    await input.clear();
    await input.fill(title);
  }

  async fillEditContent(content: string): Promise<void> {
    const textarea = this.page.locator('textarea').first();
    await textarea.clear();
    await textarea.fill(content);
  }

  async getNoteTitle(): Promise<string> {
    const text = await this.page.locator('h2').first().textContent();
    return text ?? '';
  }

  async getNoteContent(): Promise<string> {
    const text = await this.page.locator('[class*="whitespace-pre-wrap"]').first().textContent();
    return text ?? '';
  }

  async isNoteListVisible(): Promise<boolean> {
    return this.page.locator('text=Your Saved Notes').isVisible().catch(() => false);
  }
}
