import { Page } from '@playwright/test';

export class ChatPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/chat');
    await this.page.waitForSelector('text=Study Chats');
  }

  async createNewChat(): Promise<void> {
    await this.page.locator('button[title="New Chat Session"]').click();
  }

  async selectChat(title: string): Promise<void> {
    await this.page.locator(`button:has-text("${title}")`).first().click();
    await this.page.waitForTimeout(300);
  }

  async sendMessage(message: string): Promise<void> {
    await this.page.getByPlaceholder(/Ask a question/).fill(message);
    await this.page.getByRole('button', { name: 'Send' }).click();
  }

  async waitForResponse(): Promise<void> {
    await this.page.waitForTimeout(500);
  }

  async getMessages(): Promise<string[]> {
    return this.page.locator('[class*="whitespace-pre-wrap"]').allTextContents();
  }

  async getChatCount(): Promise<number> {
    return this.page.locator('button:has-text("Calculus Discussion"), button:has-text("Physics Review")').count();
  }

  async isChatListVisible(): Promise<boolean> {
    return this.page.locator('text=Study Chats').isVisible();
  }
}
