import { Page } from '@playwright/test';

export class AdminLoginPage {
  readonly page: Page;
  readonly LOGIN_URL = 'https://adminpanel-testing.thescribebank.com/?masterOtp=true';

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.LOGIN_URL, { waitUntil: 'networkidle' });
  }

  async enterEmail(email: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Email Address or Phone Number' }).fill(email);
  }

  async submitEmail(): Promise<void> {
    await this.page.getByRole('button', { name: 'Send OTP' }).click();
  }

  async enterOtp(otp: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Enter OTP' }).fill(otp);
  }

  async verifyAndLogin(): Promise<void> {
    await this.page.getByRole('button', { name: 'Verify & Login' }).click();
  }

  async isLoginRejected(): Promise<boolean> {
    // "Account not found." surfaces as a toast notification, not an inline
    // field error — confirmed against this env when the admin email was
    // mistyped (asnari vs ansari). Poll briefly instead of a fixed sleep.
    return this.page
      .getByText('Account not found.')
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
  }

  async waitForDashboard(timeout = 15000): Promise<boolean> {
    return this.page
      .waitForURL('**/admin/dashboard', { timeout })
      .then(() => true)
      .catch(() => false);
  }
}
