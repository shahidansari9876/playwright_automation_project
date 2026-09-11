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

  // searchQuery must be a value that narrows the table to a single row —
  // this table has no email/contact column to scope a row by (confirmed
  // live), so an ambiguous query (e.g. an email reused across many scribe
  // requests, as with a long-lived non-throwaway test account) will land on
  // whichever matching row happens to be first, not necessarily the intended
  // one. The search box also matches exam name, so a unique exam title works
  // just as well as a unique email for a fresh single-request account.
  // Waiting for the search's own network activity to settle (rather than
  // racing the still-unfiltered list) is still required either way.
  async openScribeRequest(searchQuery: string, beneficiaryName: string): Promise<void> {
    await this.page.goto(this.SCRIBE_REQUESTS_URL, { waitUntil: 'networkidle' });
    await this.page.getByRole('textbox', { name: 'Search by name, email, phone' }).fill(searchQuery);
    // The search is debounced client-side before it fires its network
    // request — waiting for networkidle right after fill() can resolve
    // before that debounce timer even elapses, racing the still-unfiltered
    // list (confirmed live: the fill lands, but the table still shows the
    // default unfiltered rows). Waiting for the URL to pick up
    // global_search first confirms the debounced request actually fired.
    await this.page.waitForURL(/global_search=/, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
    // Scoped to the results table — an unscoped page-wide role query can
    // instead match the logged-in admin's own sidebar account link (e.g.
    // "SA shahid ansari ..."), which renders before the table in the DOM,
    // whenever the admin and the test beneficiary happen to share a name.
    await this.page.getByRole('table').getByRole('link', { name: beneficiaryName }).first().click();
  }

  async openExamFromScribeRequest(searchQuery: string, beneficiaryName: string): Promise<void> {
    await this.openScribeRequest(searchQuery, beneficiaryName);
    await this.page.getByRole('tab', { name: 'Exam Schedule' }).click();
    await this.page.getByRole('link', { name: 'View' }).first().click();
  }

  // The Request Details tab (landed on by openScribeRequest()) shows a "PU
  // Semester Flow" field — "Normal flow" for a regular request vs "Enabled"
  // (plus a verification-status badge) for a PU Semester one. Confirmed live
  // against an existing regular scribe request vs an existing PU one.
  async isNormalFlow(): Promise<boolean> {
    // isVisible() checks the current DOM instant with no retry, unlike
    // waitFor() — the click into the scribe request is a client-side route
    // change that can still be in flight, causing a false negative (mirrors
    // ExamActivityPage.isPuRequirementsDialogShown()).
    return this.page
      .getByText('Normal flow')
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
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

  // Admin override under "PU Verification" on a PU semester exam's admin
  // page: bypasses the standard 12-hour chat gate immediately, independent
  // of PU/CoE verification status (confirmed live — chat unlocked on a real
  // exam still over a year away, while it was still "Awaiting Verification").
  // Idempotent: only clicks if the current state doesn't already match.
  async setChatImmediatelyEnabled(enabled: boolean): Promise<void> {
    const toggle = this.page.getByRole('switch', { name: 'Enable chat immediately' });
    await toggle.waitFor({ state: 'visible' });
    if ((await toggle.isChecked()) !== enabled) {
      await toggle.click();
    }
  }
}
