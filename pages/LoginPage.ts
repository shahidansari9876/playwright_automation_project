import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly HOMEPAGE_URL = 'https://testing.thescribebank.com';
  readonly LOGIN_URL = 'https://testing.thescribebank.com/login?masterOtp=true';
  readonly LOGIN_FALLBACK_URL = 'https://testing.thescribebank.com/login';

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.HOMEPAGE_URL, { waitUntil: 'networkidle' });

    const loginButton = this.page.locator(
      'button:has-text("Sign In"), a:has-text("Sign In"), button:has-text("Login"), a:has-text("Login"), [data-testid="signin-button"], [id*="signin" i], [href*="login"]'
    ).first();

    if (await loginButton.count() > 0 && await loginButton.isVisible().catch(() => false)) {
      await loginButton.click();
      await this.page.waitForLoadState('networkidle');
      return;
    }

    await this.page.goto(this.LOGIN_URL, { waitUntil: 'networkidle' });
    if (!this.page.url().includes('/login')) {
      await this.page.goto(this.LOGIN_FALLBACK_URL, { waitUntil: 'networkidle' });
    }
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  private async resolveEmailField(): Promise<Locator> {
    // The real field on this app is #identifier / name="identifier" (confirmed against the live site).
    // Try that first so a stray type="text" input elsewhere in the DOM can't be picked up instead.
    const identifierField = this.page.locator('input#identifier, input[name="identifier"]').first();
    if (await identifierField.count() > 0) {
      return identifierField;
    }

    // Fallback for environments where the field markup differs — the login field accepts
    // both email and phone, so it may not be type="email".
    return this.page
      .locator('input[type="email"], input[placeholder*="email"], input[placeholder*="phone"], input[type="text"], input[type="tel"]')
      .first();
  }

  async enterEmail(email: string): Promise<void> {
    const emailField = await this.resolveEmailField();
    await emailField.waitFor({ state: 'visible' });
    // The form can still be hydrating right after navigate() — a fill() that lands
    // before React takes over the input gets silently wiped back to "" a moment
    // later. A passive assertion can't recover from that, so retry the fill itself
    // (not just the check) as a unit until the value actually sticks.
    await expect(async () => {
      await emailField.fill(email);
      await expect(emailField).toHaveValue(email, { timeout: 1000 });
    }).toPass({ timeout: 10000 });
  }

  async submitEmail(): Promise<void> {
    // Includes "Login" to match the actual button text on the page
    const submitButton = this.page.locator(
      'button[type="submit"], button:has-text("Login"), button:has-text("Continue"), button:has-text("Next")'
    ).first();
    await submitButton.waitFor({ state: 'visible' });
    await submitButton.click();
  }

  async isOtpPageDisplayed(timeout = 10000): Promise<boolean> {
    // The OTP form renders inline on the same /login page — the URL never changes,
    // and it always contains the literal substring "otp" (from the masterOtp=true query
    // param), so a URL-based fallback can't distinguish "OTP shown" from "still on login".
    // The OTP input field visibility is the only reliable signal for this app.
    const otpField = this.page.getByPlaceholder('Enter 6-digit OTP');
    try {
      await otpField.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async getEmailField(): Promise<Locator | null> {
    const emailField = await this.resolveEmailField();
    if (await emailField.isVisible()) {
      return emailField;
    }
    return null;
  }

  async isErrorDisplayed(): Promise<boolean> {
    const errorLocator = this.page.locator('[class*="error"], [role="alert"], .invalid-feedback, .error-message').first();
    return await errorLocator.isVisible().catch(() => false);
  }
}