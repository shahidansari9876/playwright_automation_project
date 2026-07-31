import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages';

export class LoginPageTestSuite {
  static run() {
    test.describe('Login Page - Sanity, Positive, Negative, and Edge Cases', () => {

      test('Sanity check: Login page loads and title is correct', async ({ page }) => {
        const loginPage = new LoginPage(page);
        console.log('\n📍 Sanity: Navigate to login page');
        await loginPage.navigate();
        await loginPage.waitForPageLoad();
        const title = await page.title();
        console.log(`Page title: ${title}`);
        expect(title.length).toBeGreaterThan(0);
      });

      test('TC-003: Login failure with invalid email format (invalid@test)', async ({ page }) => {
        const loginPage = new LoginPage(page);
        console.log('\n📍 TC-003: Invalid email format rejection');
        await loginPage.navigate();
        await loginPage.enterEmail('invalid@test');
        await loginPage.submitEmail();
        const otpShown = await loginPage.isOtpPageDisplayed(3000);
        const hasError = await loginPage.isErrorDisplayed();
        console.log(`OTP shown: ${otpShown}, Error displayed: ${hasError}`);
        expect(!otpShown || hasError).toBeTruthy();
      });

      test('TC-004: Login failure with empty email field', async ({ page }) => {
        const loginPage = new LoginPage(page);
        console.log('\n📍 TC-004: Empty email field rejection');
        await loginPage.navigate();
        const emailField = await loginPage.getEmailField();
        expect(emailField).not.toBeNull();
        await emailField!.press('Enter');
        const otpShown = await loginPage.isOtpPageDisplayed(3000);
        const hasError = await loginPage.isErrorDisplayed();
        console.log(`OTP shown: ${otpShown}, Error displayed: ${hasError}`);
        expect(!otpShown || hasError).toBeTruthy();
      });

      test('TC-006: Login failure with non-existent email (nonexistent@yopmail.com)', async ({ page }) => {
        const loginPage = new LoginPage(page);
        console.log('\n📍 TC-006: Non-existent email rejection');
        await loginPage.navigate();
        await loginPage.enterEmail('nonexistent@yopmail.com');
        await loginPage.submitEmail();
        const otpShown = await loginPage.isOtpPageDisplayed(3000);
        const hasError = await loginPage.isErrorDisplayed();
        console.log(`OTP shown: ${otpShown}, Error displayed: ${hasError}`);
        expect(!otpShown || hasError).toBeTruthy();
      });

      test('TC-007: Login failure with invalid email format (missing domain)', async ({ page }) => {
        const loginPage = new LoginPage(page);
        console.log('\n📍 TC-007: Email without domain rejection');
        await loginPage.navigate();
        await loginPage.enterEmail('invalidemail@test');
        await loginPage.submitEmail();
        const otpShown = await loginPage.isOtpPageDisplayed(3000);
        const hasError = await loginPage.isErrorDisplayed();
        console.log(`OTP shown: ${otpShown}, Error displayed: ${hasError}`);
        expect(!otpShown || hasError).toBeTruthy();
      });

      test('TC-012: Email with extra spaces (  shahidstq@yopmail.com  )', async ({ page }) => {
        const loginPage = new LoginPage(page);
        console.log('\n📍 TC-012: Email with extra spaces');
        await loginPage.navigate();
        const emailField = await loginPage.getEmailField();
        expect(emailField).not.toBeNull();
        await emailField!.click();
        await emailField!.fill('  shahidstq@yopmail.com  ');
        await loginPage.submitEmail();
        // The app must reach a definite state: either it trims/accepts the input and shows
        // the OTP step, or it rejects the input and shows an error. Never left ambiguous.
        const otpShown = await loginPage.isOtpPageDisplayed(5000);
        const hasError = await loginPage.isErrorDisplayed();
        console.log(`OTP shown: ${otpShown}, Error displayed: ${hasError}`);
        expect(otpShown || hasError).toBeTruthy();
      });

      test('TC-014: Email case sensitivity test (SHAHIDSTQ@YOPMAIL.COM)', async ({ page }) => {
        const loginPage = new LoginPage(page);
        console.log('\n📍 TC-014: Email with uppercase');
        await loginPage.navigate();
        await loginPage.enterEmail('SHAHIDSTQ@YOPMAIL.COM');
        await loginPage.submitEmail();
        const otpShown = await loginPage.isOtpPageDisplayed(5000);
        const hasError = await loginPage.isErrorDisplayed();
        console.log(`OTP shown: ${otpShown}, Error displayed: ${hasError}`);
        expect(otpShown || hasError).toBeTruthy();
      });

    });
  }
}

LoginPageTestSuite.run();
