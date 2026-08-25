import { Page } from '@playwright/test';
import { ADMIN_BASE_URL } from './env';

/**
 * Admin-side PU/COE verification for a scribe request's exam.
 *
 * The admin's internal exam ID is NOT the same as the public-facing exam ID
 * used in /beneficiary/exam/:id and /volunteer/exam/:id URLs (confirmed live:
 * a beneficiary-side exam 173 mapped to admin exam 221). Always reach the
 * exam via Scribe Requests search -> "Exam Schedule" tab -> "View", never by
 * guessing /admin/exams/:id from the public-facing ID.
 */
export class AdminCoeVerificationPage {
  readonly page: Page;
  readonly SCRIBE_REQUESTS_URL = `${ADMIN_BASE_URL}/admin/scribe-requests`;

  constructor(page: Page) {
    this.page = page;
  }

  // searchQuery should be a unique value (email) rather than the display
  // name — firstName/lastName in this suite's test data are hardcoded, so
  // repeated runs create many same-named beneficiaries. Unlike the
  // beneficiaries/volunteers admin lists, this table has no email/contact
  // column to scope a row by (confirmed live), so the best available fix is
  // waiting for the search's own network activity to settle — filtering by
  // the unique email reliably narrows the table to a single row — before
  // clicking the name link, rather than racing the still-unfiltered list.
  async openExamFromScribeRequest(searchQuery: string, beneficiaryName: string): Promise<void> {
    await this.page.goto(this.SCRIBE_REQUESTS_URL, { waitUntil: 'networkidle' });
    await this.page.getByRole('textbox', { name: 'Search by name, email, phone' }).fill(searchQuery);
    await this.page.waitForLoadState('networkidle');
    await this.page.getByRole('link', { name: beneficiaryName }).first().click();
    await this.page.getByRole('tab', { name: 'Exam Schedule' }).click();
    await this.page.getByRole('link', { name: 'View' }).first().click();
  }

  async openPuVerificationTab(): Promise<void> {
    await this.page.getByRole('tab', { name: 'PU Verification' }).click();
  }

  async checkAllVerificationItems(): Promise<void> {
    const checkboxes = this.page.getByRole('checkbox');
    // count() doesn't auto-wait — guard against reading 0 before the checklist renders.
    await checkboxes.first().waitFor({ state: 'visible' });
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }
  }

  async approveAndVerify(): Promise<void> {
    await this.page.getByRole('button', { name: 'Approve & Verify' }).click();
  }

  async rejectVerification(
    reason: string,
    target: 'Volunteer' | 'Beneficiary' | 'Both',
    path: 'Reject & Hold' | 'Reject & Release'
  ): Promise<void> {
    await this.page.getByRole('button', { name: 'Reject', exact: true }).click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('textbox').first().fill(reason);
    await dialog.getByRole('radio', { name: target, exact: true }).click();
    await dialog.getByRole('radio', { name: new RegExp(`^${path}`) }).click();
    await dialog.getByRole('button', { name: `Confirm ${path}` }).click();
  }

  async setEndedForTesting(): Promise<void> {
    // QA-only affordance: moves the exam date/end-time into the past so the
    // completion flow (normally gated on the real exam time passing) can be
    // exercised immediately. Never available/needed outside this test env.
    await this.page.getByRole('button', { name: 'Set Ended (QA)' }).click();
    await this.page.getByRole('button', { name: 'Confirm Override' }).click();
  }
}
