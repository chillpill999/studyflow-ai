import { Page } from '@playwright/test';

export class PlannerPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/planner');
    await this.page.waitForSelector('text=AI Study Planner');
  }

  async selectDocument(docName: string): Promise<void> {
    await this.page.locator('select').first().selectOption({ label: docName });
  }

  async setExamDate(date: string): Promise<void> {
    await this.page.locator('input[type="date"]').first().fill(date);
  }

  async setStudyHours(hours: string): Promise<void> {
    await this.page.locator('input[type="number"]').first().fill(hours);
  }

  async clickGeneratePlan(): Promise<void> {
    await this.page.getByRole('button', { name: 'Generate Syllabus Timeline' }).click();
  }

  async clickAddCustomTask(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add Custom Task' }).click();
  }

  async fillTaskTitle(title: string): Promise<void> {
    await this.page.getByPlaceholder(/Task Title/).fill(title);
  }

  async fillTaskDescription(desc: string): Promise<void> {
    await this.page.getByPlaceholder(/Requirements/).fill(desc);
  }

  async selectTaskPriority(priority: string): Promise<void> {
    await this.page.locator('select').nth(1).selectOption({ label: priority });
  }

  async setTaskDueDate(date: string): Promise<void> {
    await this.page.locator('input[type="date"]').nth(1).fill(date);
  }

  async clickSaveTask(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save Task' }).click();
  }

  async clickTaskNext(): Promise<void> {
    await this.page.getByRole('button', { name: 'Next' }).first().click();
  }

  async clickTaskReset(): Promise<void> {
    await this.page.getByRole('button', { name: 'Reset' }).first().click();
  }

  async clickDeleteTask(): Promise<void> {
    await this.page.locator('button:has(svg.lucide-trash2)').first().click();
  }

  async getTaskTitles(): Promise<string[]> {
    return this.page.locator('[class*="font-bold"][class*="text-purple-950"]').allTextContents();
  }

  async isTaskVisible(title: string): Promise<boolean> {
    return this.page.locator(`text=${title}`).first().isVisible().catch(() => false);
  }
}
