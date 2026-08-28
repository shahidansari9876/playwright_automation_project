import { Page } from '@playwright/test';
import { ADMIN_BASE_URL } from './env';

/**
 * Admin-side Payouts list (/admin/payouts) — find a payout, open its "Edit
 * payment" dialog, and move it through to Completed with a transaction ID.
 */
export class AdminPayoutsPage {
  readonly page: Page;
  readonly PAYOUTS_URL = `${ADMIN_BASE_URL}/admin/payouts`;

  constructor(page: Page) {
    this.page = page;
  }

  // searchQuery should be a value unique to this payout (e.g. the scribe
  // request's exam title) rather than a volunteer/beneficiary name — a
  // long-lived reused test account accumulates many prior payouts, so an
  // ambiguous query would open whichever row happens to be first, not
  // necessarily the intended one (mirrors AdminCoeVerificationPage).
  // Returns the exam's internal admin ID (e.g. "274") shown in the dialog —
  // this is NOT the public /volunteer/exam/:id or /beneficiary/exam/:id used
  // elsewhere in this suite, but it's what the volunteer-side Assistance
  // Payouts search matches on (see VolunteerPayoutsPage).
  async openPayoutForExam(searchQuery: string): Promise<string> {
    await this.page.goto(this.PAYOUTS_URL, { waitUntil: 'networkidle' });
    await this.page
      .getByRole('textbox', { name: 'Search by volunteer name, transaction/UTR ID, exam name, or subject' })
      .fill(searchQuery);
    // Debounced search, same as AdminCoeVerificationPage.openScribeRequest() —
    // networkidle right after fill() can resolve before the debounce timer
    // fires the actual request, leaving the table still showing unfiltered rows.
    await this.page.waitForURL(/global_search=/, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
    await this.page.getByRole('table').getByRole('button', { name: 'Edit payment' }).first().click();

    const examId = await this.getDialogFieldValue('Exam ID');
    return examId.replace('#', '');
  }

  // The dialog's summary block renders each field as two adjacent <p> tags
  // (a label paragraph immediately followed by its value paragraph) —
  // confirmed live for both "Exam ID" (e.g. "#111") and "Current Status"
  // (e.g. "REQUESTED").
  private async getDialogFieldValue(label: string): Promise<string> {
    const value = await this.page
      .getByRole('dialog')
      .locator('p', { hasText: label })
      .locator('xpath=following-sibling::*[1]')
      .textContent();
    return (value ?? '').trim();
  }

  async getCurrentStatus(): Promise<string> {
    return this.getDialogFieldValue('Current Status');
  }

  async ensureNotificationsChecked(): Promise<void> {
    const volunteerCheckbox = this.page.getByRole('checkbox', { name: 'Send notification to volunteer' });
    const adminCheckbox = this.page.getByRole('checkbox', { name: 'Send notification to admins' });
    if (!(await volunteerCheckbox.isChecked())) await volunteerCheckbox.check();
    if (!(await adminCheckbox.isChecked())) await adminCheckbox.check();
  }

  async selectPaymentStatus(status: string): Promise<void> {
    await this.page.getByRole('combobox', { name: 'Payment Status *' }).click();
    await this.page.getByRole('option', { name: status, exact: true }).click();
  }

  // Only present once selectPaymentStatus('Completed') reveals the
  // "Transaction Details" section.
  async selectPaymentMethod(method: 'Cash' | 'Bank Transfer' | 'UPI Payments' | 'Others'): Promise<void> {
    await this.page.getByRole('combobox', { name: 'Payment Method' }).click();
    await this.page.getByRole('option', { name: method, exact: true }).click();
  }

  async fillTransactionId(transactionId: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Transaction ID / UTR ID' }).fill(transactionId);
  }

  async updatePayment(): Promise<void> {
    await this.page.getByRole('button', { name: 'Update Payment' }).click();
  }
}
