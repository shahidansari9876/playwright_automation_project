import { Page, Locator } from '@playwright/test';
import { BASE_URL } from './env';

export class SignUpPage {
  readonly page: Page;
  readonly HOMEPAGE_URL = BASE_URL;
  // Confirmed live (2026-09-11): the real route is the hyphenated `/sign-up`
  // (matching RegistrationPage.ts and the homepage's own "Join Now" links) —
  // `/signup` (no hyphen) 404s on the test server now too, not just production.
  readonly SIGNUP_URL = `${BASE_URL}/sign-up`;
  readonly SIGNUP_FALLBACK_URL = `${BASE_URL}/register`;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.goto(this.HOMEPAGE_URL, { waitUntil: 'networkidle' });

    const signupButton = this.page.locator(
      'button:has-text("Sign Up"), a:has-text("Sign Up"), button:has-text("Register"), a:has-text("Register"), a:has-text("Join"), button:has-text("Join"), [href*="signup" i], [href*="register" i]'
    ).first();

    if (await signupButton.count() > 0 && await signupButton.isVisible().catch(() => false)) {
      await signupButton.click();
      await this.page.waitForLoadState('networkidle');
      return;
    }

    const signinFallback = this.page.locator(
      'button:has-text("Sign In"), a:has-text("Sign In"), button:has-text("Login"), a:has-text("Login"), [href*="login" i], [id*="signin" i]'
    ).first();

    if (await signinFallback.count() > 0 && await signinFallback.isVisible().catch(() => false)) {
      await signinFallback.click();
      await this.page.waitForLoadState('networkidle');
      return;
    }

    await this.page.goto(this.SIGNUP_URL, { waitUntil: 'networkidle' });
    if (!this.page.url().includes('/signup')) {
      await this.page.goto(this.SIGNUP_FALLBACK_URL, { waitUntil: 'networkidle' });
    }
  }

  private async findVisibleField(selectors: string[], timeout = 10000): Promise<Locator | null> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      for (const selector of selectors) {
        const locator = this.page.locator(selector).first();
        if (await locator.count() > 0 && await locator.isVisible().catch(() => false)) {
          return locator;
        }
      }
      await this.page.waitForTimeout(500);
    }
    return null;
  }

  async enterFullName(name: string): Promise<void> {
    const nameField = await this.findVisibleField([
      'input[name*="name" i]',
      'input[placeholder*="name" i]',
      'input[id*="name" i]',
      'input[autocomplete="name"]',
      'input[type="text"]'
    ], 15000);

    if (!nameField) {
      throw new Error('Full name field not found on signup page');
    }
    await nameField.fill(name);
  }

  async enterEmail(email: string): Promise<void> {
    const emailField = await this.findVisibleField([
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[name*="email" i]',
      'input[id*="email" i]',
      'input[autocomplete="email"]'
    ], 15000);

    if (!emailField) {
      throw new Error('Email field not found on signup page');
    }
    await emailField.fill(email);
  }

  async enterPhone(phone: string): Promise<void> {
    const phoneField = await this.findVisibleField([
      'input[type="tel"]',
      'input[placeholder*="phone" i]',
      'input[name*="phone" i]',
      'input[id*="phone" i]',
      'input[placeholder*="mobile" i]'
    ], 15000);

    if (!phoneField) {
      throw new Error('Phone field not found on signup page');
    }
    await phoneField.fill(phone);
  }

  async submitRegistration(): Promise<void> {
    const submitButton = await this.findVisibleField([
      'button[type="submit"]',
      'button:has-text("Sign Up")',
      'button:has-text("Register")',
      'button:has-text("Submit")',
      'button:has-text("Continue")',
      'button:has-text("Next")'
    ], 15000);

    if (!submitButton) {
      throw new Error('Submit button not found on signup page');
    }
    await submitButton.click();
  }

  async isErrorDisplayed(): Promise<boolean> {
    const errorLocator = this.page.locator('[class*="error"], [role="alert"], .invalid-feedback, .error-message').first();
    return await errorLocator.isVisible().catch(() => false);
  }
}
