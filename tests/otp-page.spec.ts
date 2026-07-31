import { test, expect } from '@playwright/test';
import { LoginPage, OtpPage } from '../pages';

export class OtpPageTestSuite {
  static run() {
    test.describe('OTP Page - Positive, Negative, and Edge Cases', () => {
      // All tests below log into the same fixed account (shahidstq@yopmail.com).
      // Running them in parallel fires concurrent login/OTP requests at that one
      // live account, which races against itself on the backend — serialize so
      // each flow completes before the next one starts.
      test.describe.configure({ mode: 'serial' });

      test('TC-001: Valid Email + Valid OTP (123456) → Successful Login', async ({ page }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        const otpPage = new OtpPage(page);

        console.log('\n📍 TC-001: Valid Email + Valid OTP');
        // Navigate straight to the masterOtp=true URL (not loginPage.navigate(), which
        // clicks "Sign In" from the homepage and lands on plain /login) — the fixed
        // OTP bypass ('123456') only authenticates when this query param is present.
        await page.goto(loginPage.LOGIN_URL, { waitUntil: 'networkidle' });
        await loginPage.enterEmail('shahidstq@yopmail.com');
        await loginPage.submitEmail();

        const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
        expect(isOtpDisplayed).toBeTruthy();

        await otpPage.enterOtp('123456');
        await otpPage.submitOtp();

        // The post-OTP redirect away from /login can take a few seconds on this
        // backend — poll instead of sampling once after a fixed sleep.
        await expect(async () => {
          const currentUrl = await otpPage.getPageUrl();
          const isDashboard = await otpPage.isDashboardDisplayed();
          const isSuccessful = isDashboard || currentUrl.includes('dashboard') || currentUrl.includes('home') || !currentUrl.includes('login');
          expect(isSuccessful).toBeTruthy();
        }).toPass({ timeout: 15000 });

        const currentUrl = await otpPage.getPageUrl();
        const isDashboard = await otpPage.isDashboardDisplayed();
        console.log(`Current URL: ${currentUrl}, Dashboard visible: ${isDashboard}`);
      });

      test('TC-002: Valid Email + Invalid OTP (000000) → Rejection', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const otpPage = new OtpPage(page);

        console.log('\n📍 TC-002: Invalid OTP rejection');
        await loginPage.navigate();
        await loginPage.enterEmail('shahidstq@yopmail.com');
        await loginPage.submitEmail();

        const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
        expect(isOtpDisplayed).toBeTruthy();

        await otpPage.enterOtp('000000');
        await otpPage.submitOtp();
        await page.waitForTimeout(2000);

        const hasError = await otpPage.isErrorDisplayed();
        const otpFieldStillPresent = (await otpPage.getOtpField()) !== null;
        console.log(`Error displayed: ${hasError}, OTP field still present: ${otpFieldStillPresent}`);

        expect(hasError || otpFieldStillPresent).toBeTruthy();
      });

      test('TC-005: Login failure with empty OTP field', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const otpPage = new OtpPage(page);

        console.log('\n📍 TC-005: Empty OTP field rejection');
        await loginPage.navigate();
        await loginPage.enterEmail('shahidstq@yopmail.com');
        await loginPage.submitEmail();

        const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
        expect(isOtpDisplayed).toBeTruthy();

        const otpField = await otpPage.getOtpField();
        expect(otpField).not.toBeNull();
        await otpField!.press('Enter');
        await page.waitForTimeout(2000);

        const hasError = await otpPage.isErrorDisplayed();
        const otpFieldStillPresent = (await otpPage.getOtpField()) !== null;
        console.log(`Error displayed: ${hasError}, OTP field still present: ${otpFieldStillPresent}`);

        expect(hasError || otpFieldStillPresent).toBeTruthy();
      });

      test('TC-008: OTP entry with special characters (!@#$%^)', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const otpPage = new OtpPage(page);

        console.log('\n📍 TC-008: OTP with special characters');
        await loginPage.navigate();
        await loginPage.enterEmail('shahidstq@yopmail.com');
        await loginPage.submitEmail();

        const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
        expect(isOtpDisplayed).toBeTruthy();

        await otpPage.enterOtp('!@#$%^');
        await otpPage.submitOtp();
        await page.waitForTimeout(2000);

        const hasError = await otpPage.isErrorDisplayed();
        const otpFieldStillPresent = (await otpPage.getOtpField()) !== null;
        console.log(`Error displayed: ${hasError}, OTP field still present: ${otpFieldStillPresent}`);

        expect(hasError || otpFieldStillPresent).toBeTruthy();
      });

      test('TC-009: OTP entry with insufficient digits (123)', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const otpPage = new OtpPage(page);

        console.log('\n📍 TC-009: OTP with insufficient digits');
        await loginPage.navigate();
        await loginPage.enterEmail('shahidstq@yopmail.com');
        await loginPage.submitEmail();

        const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
        expect(isOtpDisplayed).toBeTruthy();

        await otpPage.enterOtp('123');
        await otpPage.submitOtp();
        await page.waitForTimeout(2000);

        const hasError = await otpPage.isErrorDisplayed();
        const otpFieldStillPresent = (await otpPage.getOtpField()) !== null;
        console.log(`Error displayed: ${hasError}, OTP field still present: ${otpFieldStillPresent}`);

        expect(hasError || otpFieldStillPresent).toBeTruthy();
      });

      test('TC-010: OTP entry with spaces (12 34 56)', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const otpPage = new OtpPage(page);

        console.log('\n📍 TC-010: OTP with spaces');
        await loginPage.navigate();
        await loginPage.enterEmail('shahidstq@yopmail.com');
        await loginPage.submitEmail();

        const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
        expect(isOtpDisplayed).toBeTruthy();

        await otpPage.enterOtp('12 34 56');
        await otpPage.submitOtp();
        await page.waitForTimeout(2000);

        const hasError = await otpPage.isErrorDisplayed();
        const otpFieldStillPresent = (await otpPage.getOtpField()) !== null;
        console.log(`Error displayed: ${hasError}, OTP field still present: ${otpFieldStillPresent}`);

        expect(hasError || otpFieldStillPresent).toBeTruthy();
      });

      test('TC-011: OTP entry with letters (ABCDEF)', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const otpPage = new OtpPage(page);

        console.log('\n📍 TC-011: OTP with letters');
        await loginPage.navigate();
        await loginPage.enterEmail('shahidstq@yopmail.com');
        await loginPage.submitEmail();

        const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
        expect(isOtpDisplayed).toBeTruthy();

        await otpPage.enterOtp('ABCDEF');
        await otpPage.submitOtp();
        await page.waitForTimeout(2000);

        const hasError = await otpPage.isErrorDisplayed();
        const otpFieldStillPresent = (await otpPage.getOtpField()) !== null;
        console.log(`Error displayed: ${hasError}, OTP field still present: ${otpFieldStillPresent}`);

        expect(hasError || otpFieldStillPresent).toBeTruthy();
      });

      test('TC-013: Very long OTP entry (123456789012345)', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const otpPage = new OtpPage(page);

        console.log('\n📍 TC-013: Very long OTP');
        await loginPage.navigate();
        await loginPage.enterEmail('shahidstq@yopmail.com');
        await loginPage.submitEmail();

        const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
        expect(isOtpDisplayed).toBeTruthy();

        await otpPage.enterOtp('123456789012345');
        await otpPage.submitOtp();
        await page.waitForTimeout(2000);

        const hasError = await otpPage.isErrorDisplayed();
        const otpFieldStillPresent = (await otpPage.getOtpField()) !== null;
        console.log(`Error displayed: ${hasError}, OTP field still present: ${otpFieldStillPresent}`);

        expect(hasError || otpFieldStillPresent).toBeTruthy();
      });

    });
  }
}

OtpPageTestSuite.run();
