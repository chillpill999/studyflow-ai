import { Page } from '@playwright/test';

export class MindmapPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/mindmap');
    await this.page.waitForSelector('text=Interactive Concept Map');
  }

  async selectDocument(docName: string): Promise<void> {
    await this.page.locator('select').first().selectOption({ label: docName });
  }

  async clickGenerate(): Promise<void> {
    await this.page.getByRole('button', { name: 'Generate Concept Map' }).click();
  }

  async isGraphVisible(): Promise<boolean> {
    return this.page.locator('.react-flow').isVisible().catch(() => false);
  }

  async getNodeCount(): Promise<number> {
    return this.page.locator('.react-flow__node').count();
  }

  async clickExportJSON(): Promise<void> {
    await this.page.getByRole('button', { name: 'JSON' }).click();
  }

  async clickExportSVG(): Promise<void> {
    await this.page.getByRole('button', { name: 'SVG' }).click();
  }

  async isPlaceholderVisible(): Promise<boolean> {
    return this.page.locator('text=Concept Map Viewer').isVisible().catch(() => false);
  }
}
