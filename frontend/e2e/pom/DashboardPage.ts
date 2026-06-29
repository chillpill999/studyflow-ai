import { Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.page.waitForSelector('text=Welcome back');
  }

  async navigateTo(section: 'chat' | 'flashcards' | 'planner' | 'notes' | 'analytics' | 'mindmap'): Promise<void> {
    const linkNames: Record<string, string> = {
      chat: 'Study Chat',
      flashcards: 'Flashcards',
      planner: 'Planner',
      notes: 'Notes',
      analytics: 'Analytics',
      mindmap: 'Mind Map',
    };
    await this.page.getByRole('link', { name: linkNames[section] }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async openUploadDialog(): Promise<void> {
    await this.page.getByText('Drag & Drop PDF Syllabus').click();
  }

  async uploadFile(fileName: string, content: string): Promise<void> {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.getByText('Drag & Drop PDF Syllabus').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: fileName,
      mimeType: 'application/pdf',
      buffer: Buffer.from(content),
    });
  }

  async getDocumentCount(): Promise<number> {
    return this.page.locator('[class*="text-purple-950"] >> text=.pdf').count();
  }

  async clickChatRAG(): Promise<void> {
    await this.page.locator(`a:has-text("Chat RAG")`).first().click();
  }

  async clickDeleteDocument(): Promise<void> {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.locator('button[title="Delete document"]').first().click();
  }

  async waitForDashboardLoad(): Promise<void> {
    await expect(this.page.locator('text=Welcome back').first()).toBeVisible({ timeout: 10000 });
  }
}
