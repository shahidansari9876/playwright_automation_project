import { Page } from '@playwright/test';

/**
 * Volunteer "Add Bank Account" form, reached either directly at
 * /volunteer/profile/payment-methods or via the payout dialog's
 * "Add an account" link (ExamActivityPage.clickAddAnAccount()).
 */
export class PaymentMethodsPage {
  readonly page: Page;
  readonly URL = 'https://testing.thescribebank.com/volunteer/profile/payment-methods';

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.URL, { waitUntil: 'networkidle' });
  }

  async clickAddPaymentMethod(): Promise<void> {
    await this.page.getByRole('button', { name: /Add (Your First )?Payment Method/ }).click();
  }

  async fillAccountHolderName(name: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Account Holder Name' }).fill(name);
  }

  async fillBankName(bank: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Bank Name' }).fill(bank);
  }

  async fillAccountNumber(accountNumber: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Account Number', exact: true }).fill(accountNumber);
  }

  async fillConfirmAccountNumber(accountNumber: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Confirm Account Number' }).fill(accountNumber);
  }

  async fillIfscCode(ifsc: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'IFSC Code', exact: true }).fill(ifsc);
  }

  async fillConfirmIfscCode(ifsc: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Confirm IFSC Code' }).fill(ifsc);
  }

  async fillBranch(branch: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Branch' }).fill(branch);
  }

  async fillDisplayName(name: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Account Name (Display Name)' }).fill(name);
  }

  async checkMarkAsDefault(): Promise<void> {
    await this.page.getByRole('checkbox', { name: 'Mark as Default' }).check();
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }
}
