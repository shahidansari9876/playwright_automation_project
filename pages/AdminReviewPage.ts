import { Page } from '@playwright/test';

/**
 * Admin-side document review for both Beneficiaries and Volunteers. Both
 * list pages share the same search box, "View" link, and tab/approve/reject
 * shape, so one class drives both instead of duplicating per role.
 */
export class AdminReviewPage {
  readonly page: Page;
  readonly BENEFICIARIES_URL = 'https://adminpanel-testing.thescribebank.com/admin/beneficiaries';
  readonly VOLUNTEERS_URL = 'https://adminpanel-testing.thescribebank.com/admin/volunteers';

  constructor(page: Page) {
    this.page = page;
  }

  async searchAndOpen(listUrl: string, query: string): Promise<void> {
    await this.page.goto(listUrl, { waitUntil: 'networkidle' });
    await this.page.getByRole('textbox', { name: 'Search by name, email, phone' }).fill(query);
    await this.page.getByRole('link', { name: 'View' }).first().click();
  }

  async openTab(name: string): Promise<void> {
    await this.page.getByRole('tab', { name }).click();
  }

  // --- Identity document (beneficiary + volunteer share this exact panel) ---

  async approveIdentityDocument(): Promise<void> {
    await this.page.getByRole('button', { name: 'Approve Document' }).click();
  }

  async rejectIdentityDocument(reason: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Reject Document' }).click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Rejection Reason' }).fill(reason);
    await dialog.getByRole('button', { name: 'Reject Document' }).click();
  }

  // --- Professional photo (its own sub-tab under Identity) ---

  async verifyPhoto(): Promise<void> {
    await this.page.getByRole('button', { name: 'Verify Photo' }).click();
  }

  async rejectPhoto(): Promise<void> {
    await this.page.getByRole('button', { name: 'Reject Photo' }).click();
  }

  // --- Disability certificate (beneficiary only) ---

  async approveDisabilityCertificate(): Promise<void> {
    await this.page.getByRole('button', { name: 'Approve Certificate' }).click();
  }

  async rejectDisabilityCertificate(): Promise<void> {
    await this.page.getByRole('button', { name: 'Reject Certificate' }).click();
  }

  // --- Bank / payment method verification (volunteer "Payment" tab) ---

  async approveBankAccount(): Promise<void> {
    await this.page.getByRole('button', { name: 'Approve' }).click();
  }

  async rejectBankAccount(): Promise<void> {
    await this.page.getByRole('button', { name: 'Reject' }).click();
  }
}
