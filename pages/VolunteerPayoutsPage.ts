import { Page } from '@playwright/test';
import { BASE_URL } from './env';

/**
 * Volunteer-side Assistance Payouts list (/volunteer/assistance-payouts).
 * Its search box matches the numeric "Exam ID" shown on each card (the
 * admin's internal exam id from AdminPayoutsPage.openPayoutForExam(), NOT
 * the public /volunteer/exam/:id used elsewhere in this suite) or the exam
 * Subject — confirmed live that it does NOT match the scribe request title.
 */
export class VolunteerPayoutsPage {
  readonly page: Page;
  readonly URL = `${BASE_URL}/volunteer/assistance-payouts`;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.URL, { waitUntil: 'networkidle' });
  }

  async searchByExamId(examId: string | number): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Search by Exam ID or Subject' }).fill(String(examId));
  }

  async isStatusShown(status: string): Promise<boolean> {
    // waitFor(), not isVisible() — the filtered result re-renders a beat
    // after fill() (mirrors AdminCoeVerificationPage.isNormalFlow()).
    return this.page
      .getByText(status, { exact: true })
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
  }
}
