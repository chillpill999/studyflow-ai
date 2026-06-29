import { test, expect } from '@playwright/test';
import { AuthPage } from './pom/AuthPage';
import { ChatPage } from './pom/ChatPage';
import {
  setupCommonMocks,
  setupAuthMocks,
  setupDocumentMocks,
  setupChatMocks,
} from './mocks';

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonMocks(page);
    await setupAuthMocks(page);
    await setupDocumentMocks(page);
    await setupChatMocks(page);
  });

  test('Chat page renders with sidebar and workspace', async ({ page }) => {
    const auth = new AuthPage(page);
    const chat = new ChatPage(page);
    await auth.login();
    await chat.goto();

    await expect(page.getByText('Study Chats')).toBeVisible();
    await expect(page.getByText('Calculus Discussion')).toBeVisible();
    await expect(page.getByText('Physics Review')).toBeVisible();
  });

  test('Selecting a chat loads messages', async ({ page }) => {
    const auth = new AuthPage(page);
    const chat = new ChatPage(page);
    await auth.login();
    await chat.goto();

    await chat.selectChat('Calculus Discussion');
    await page.waitForTimeout(500);

    const messages = await chat.getMessages();
    expect(messages.length).toBeGreaterThan(0);
  });

  test('New chat button is functional', async ({ page }) => {
    const auth = new AuthPage(page);
    const chat = new ChatPage(page);
    await auth.login();
    await chat.goto();

    await chat.createNewChat();
    await page.waitForTimeout(300);
  });

  test('Send message input and button are visible', async ({ page }) => {
    const auth = new AuthPage(page);
    const chat = new ChatPage(page);
    await auth.login();
    await chat.goto();

    await expect(page.getByPlaceholder(/Ask a question/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
  });
});
