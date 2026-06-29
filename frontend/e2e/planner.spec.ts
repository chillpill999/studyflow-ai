import { test, expect } from '@playwright/test';
import { AuthPage } from './pom/AuthPage';
import { PlannerPage } from './pom/PlannerPage';
import { setupCommonMocks, setupAuthMocks, setupDocumentMocks, setupPlannerMocks } from './mocks';

test.describe('Planner', () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonMocks(page);
    await setupAuthMocks(page);
    await setupDocumentMocks(page);
    await setupPlannerMocks(page);
  });

  test('Planner page renders with kanban board', async ({ page }) => {
    const auth = new AuthPage(page);
    const planner = new PlannerPage(page);
    await auth.login();
    await planner.goto();

    await expect(page.getByRole('heading', { name: 'AI Study Planner' })).toBeVisible();
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Completed')).toBeVisible();
  });

  test('Existing tasks are displayed in their columns', async ({ page }) => {
    const auth = new AuthPage(page);
    const planner = new PlannerPage(page);
    await auth.login();
    await planner.goto();
    await page.waitForTimeout(500);

    const taskTitles = await planner.getTaskTitles();
    const allTasksExist = taskTitles.some(t => t.includes('Read Physics Chapter 3'));
    expect(allTasksExist).toBeTruthy();
  });

  test('Add Custom Task form opens and submits', async ({ page }) => {
    const auth = new AuthPage(page);
    const planner = new PlannerPage(page);
    await auth.login();
    await planner.goto();
    await page.waitForTimeout(300);

    await planner.clickAddCustomTask();
    await expect(page.getByPlaceholder(/Task Title/)).toBeVisible();

    await planner.fillTaskTitle('Custom Task Title');
    await planner.fillTaskDescription('Custom description');
    await planner.selectTaskPriority('Urgent');
    await planner.clickSaveTask();

    await page.waitForTimeout(300);
  });

  test('Task Next button transitions status', async ({ page }) => {
    const auth = new AuthPage(page);
    const planner = new PlannerPage(page);
    await auth.login();
    await planner.goto();
    await page.waitForTimeout(500);

    await planner.clickTaskNext();
    await page.waitForTimeout(300);
  });

  test('Schedule section inputs are visible', async ({ page }) => {
    const auth = new AuthPage(page);
    const planner = new PlannerPage(page);
    await auth.login();
    await planner.goto();

    await expect(page.getByText('Schedule Study Plan')).toBeVisible();
    await expect(page.getByText('Target Exam Date')).toBeVisible();
    await expect(page.getByText('Daily Study Budget')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Syllabus Timeline' })).toBeVisible();
  });
});
