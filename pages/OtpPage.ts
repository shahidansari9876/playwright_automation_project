import { Page, Locator } from '@playwright/test';

export class OtpPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async enterOtp(otp: string): Promise<void> {
    const otpField = await this.getOtpField();
    if (!otpField) {
      throw new Error('OTP field not found on OTP page');
    }
    await otpField.fill(otp);
  }

  async submitOtp(): Promise<void> {
    const submitButton = this.page.locator('button[type="submit"], button:has-text("Verify"), button:has-text("Confirm"), button:has-text("Continue"), button:has-text("Next")').first();
    await submitButton.click();
  }

  async getOtpField(): Promise<Locator | null> {
    // Must target the placeholder specifically: a generic input[type="text"] selector
    // also matches the disabled identifier/email field, which stays in the DOM
    // (disabled, not hidden) after the email step is submitted.
    const otpField = this.page.getByPlaceholder('Enter 6-digit OTP');
    if (await otpField.isVisible().catch(() => false)) {
      return otpField;
    }
    return null;
  }

  async isErrorDisplayed(): Promise<boolean> {
    const errorLocator = this.page.locator('[class*="error"], [role="alert"], .invalid-feedback, .error-message').first();
    return await errorLocator.isVisible().catch(() => false);
  }

  async getPageUrl(): Promise<string> {
    return this.page.url();
  }

  async isDashboardDisplayed(): Promise<boolean> {
    const dashboardLocator = this.page.locator('[class*="dashboard"], [class*="home"], header, nav').first();
    return await dashboardLocator.isVisible().catch(() => false);
  }
}