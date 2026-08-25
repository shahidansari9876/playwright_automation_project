import { Page } from '@playwright/test';
import { BASE_URL } from './env';

/**
 * The real /sign-up flow (email + phone, single combined OTP, then role
 * selection on /create-profile). This is distinct from SignUpPage.ts, which
 * targets a generic full-name/email/phone form that does not match this
 * app's actual signup page.
 */
export class RegistrationPage {
  readonly page: Page;
  readonly SIGNUP_URL = `${BASE_URL}/sign-up?masterOtp=true`;

  constructor(page: Page) {
    this.page = page;
  }

  // masterOtp=true must be on the URL itself — the fixed OTP bypass ('123456')
  // only applies when this query param is present on the initial navigation.
  async navigate(): Promise<void> {
    await this.page.goto(this.SIGNUP_URL, { waitUntil: 'networkidle' });
  }

  async enterEmail(email: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Email Address *' }).fill(email);
  }

  async enterPhone(phone: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Phone Number *' }).fill(phone);
  }

  async submitSignUp(): Promise<void> {
    await this.page.getByRole('button', { name: 'Sign Up' }).click();
  }

  async isOtpFieldVisible(timeout = 20000): Promise<boolean> {
    return this.page
      .getByPlaceholder('Enter 6-digit OTP')
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);
  }

  async enterOtp(otp: string): Promise<void> {
    await this.page.getByPlaceholder('Enter 6-digit OTP').fill(otp);
  }

  async verifyAndCreateAccount(): Promise<void> {
    await this.page.getByRole('button', { name: 'Verify & Create Account' }).click();
  }
}
