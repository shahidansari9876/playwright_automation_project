import { test, expect } from '@playwright/test';
import { LoginPage, OtpPage } from '../pages';

// Test Suite
test.describe('🔐 Login Flow - Complete Test Suite', () => {

  test.describe('✅ POSITIVE TEST CASES', () => {

    test('TC-001: Successful login with valid email and valid OTP', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const otpPage = new OtpPage(page);

      // Step 1: Navigate to login page
      await loginPage.navigate();
      await expect(page).toHaveURL(/login/);

      // Step 2: Enter valid email
      await loginPage.enterEmail('shahidstq@yopmail.com');
      console.log('✅ Entered valid email');

      // Step 3: Submit email
      await loginPage.submitEmail();
      console.log('✅ Email submitted');

      // Step 4: Verify OTP page appears
      const isOtpVisible = await loginPage.isOtpPageDisplayed();
      expect(isOtpVisible).toBeTruthy();
      console.log('✅ OTP page visible');

      // Step 5: Enter valid OTP
      await otpPage.enterOtp('123456');
      console.log('✅ Entered valid OTP: 123456');

      // Step 6: Submit OTP
      await otpPage.submitOtp();
      console.log('✅ OTP submitted');

      // Step 7: Verify login success (dashboard or home page)
      await page.waitForTimeout(3000);
      const isDashboard = await otpPage.isDashboardDisplayed();
      const currentUrl = await otpPage.getPageUrl();
      
      expect(isDashboard || currentUrl.includes('dashboard') || currentUrl.includes('home')).toBeTruthy();
      console.log('✅ Successfully logged in and reached dashboard');
    });

  });

  test.describe('❌ NEGATIVE TEST CASES', () => {

    test('TC-002: Login failure with valid email but invalid OTP', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const otpPage = new OtpPage(page);

      // Navigate and enter valid email
      await loginPage.navigate();
      await loginPage.enterEmail('shahidstq@yopmail.com');
      await loginPage.submitEmail();

      // Verify OTP page
      const isOtpVisible = await loginPage.isOtpPageDisplayed();
      expect(isOtpVisible).toBeTruthy();

      // Enter INVALID OTP
      await otpPage.enterOtp('000000');
      console.log('✅ Entered invalid OTP: 000000');

      // Submit invalid OTP
      await otpPage.submitOtp();

      // Verify rejection
      await page.waitForTimeout(2000);
      const hasError = await otpPage.isErrorDisplayed();
      const url = await otpPage.getPageUrl();

      expect(hasError || url.includes('otp') || url.includes('verify')).toBeTruthy();
      console.log('✅ Invalid OTP was correctly rejected');
    });

    test('TC-003: Login failure with invalid email format', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.navigate();
      
      // Enter invalid email
      await loginPage.enterEmail('invalid.email@test');
      console.log('✅ Entered invalid email format');

      await loginPage.submitEmail();
      
      // Verify rejection
      await page.waitForTimeout(2000);
      const url = page.url();
      const hasError = await loginPage.isErrorDisplayed();

      expect(!url.includes('otp') || hasError).toBeTruthy();
      console.log('✅ Invalid email format was rejected');
    });

    test('TC-004: Login failure with empty email field', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.navigate();
      
      // Try submitting without email
      const emailField = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await emailField.press('Enter');
      console.log('✅ Attempted to submit empty email');

      // Verify rejection
      await page.waitForTimeout(2000);
      const url = page.url();
      const hasError = await loginPage.isErrorDisplayed();

      expect(!url.includes('otp') || hasError).toBeTruthy();
      console.log('✅ Empty email was rejected');
    });

    test('TC-005: Login failure with empty OTP field', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const otpPage = new OtpPage(page);

      await loginPage.navigate();
      await loginPage.enterEmail('shahidstq@yopmail.com');
      await loginPage.submitEmail();

      // Verify OTP page
      const isOtpVisible = await loginPage.isOtpPageDisplayed();
      expect(isOtpVisible).toBeTruthy();

      // Try submitting without OTP
      const otpField = await otpPage.getOtpField();
      if (otpField) {
        await otpField.press('Enter');
      }
      console.log('✅ Attempted to submit empty OTP');

      // Verify rejection
      await page.waitForTimeout(2000);
      const url = await otpPage.getPageUrl();

      expect(url.includes('otp') || url.includes('verify')).toBeTruthy();
      console.log('✅ Empty OTP was rejected');
    });

    test('TC-006: Login failure with non-existent email', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.navigate();
      
      // Enter non-existent email
      await loginPage.enterEmail('nonexistent@yopmail.com');
      console.log('✅ Entered non-existent email');

      await loginPage.submitEmail();
      
      // Verify rejection
      await page.waitForTimeout(2000);
      const url = page.url();
      const hasError = await loginPage.isErrorDisplayed();

      expect(!url.includes('otp') || hasError).toBeTruthy();
      console.log('✅ Non-existent email was rejected');
    });

  });

  test.describe('⚠️ EDGE CASES', () => {

    test('TC-007: OTP entry with special characters', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const otpPage = new OtpPage(page);

      await loginPage.navigate();
      await loginPage.enterEmail('shahidstq@yopmail.com');
      await loginPage.submitEmail();

      const isOtpVisible = await loginPage.isOtpPageDisplayed();
      expect(isOtpVisible).toBeTruthy();

      // Enter OTP with special characters
      await otpPage.enterOtp('!@#$%^');
      console.log('✅ Entered OTP with special characters');

      await otpPage.submitOtp();

      // Verify rejection
      await page.waitForTimeout(2000);
      const url = await otpPage.getPageUrl();
      const hasError = await otpPage.isErrorDisplayed();

      expect(url.includes('otp') || url.includes('verify') || hasError).toBeTruthy();
      console.log('✅ Invalid OTP format was rejected');
    });

    test('TC-008: OTP entry with insufficient digits', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const otpPage = new OtpPage(page);

      await loginPage.navigate();
      await loginPage.enterEmail('shahidstq@yopmail.com');
      await loginPage.submitEmail();

      const isOtpVisible = await loginPage.isOtpPageDisplayed();
      expect(isOtpVisible).toBeTruthy();

      // Enter OTP with less digits
      await otpPage.enterOtp('123');
      console.log('✅ Entered short OTP');

      await otpPage.submitOtp();

      // Verify rejection
      await page.waitForTimeout(2000);
      const url = await otpPage.getPageUrl();

      expect(url.includes('otp') || url.includes('verify')).toBeTruthy();
      console.log('✅ Short OTP was rejected');
    });

    test('TC-009: OTP entry with spaces', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const otpPage = new OtpPage(page);

      await loginPage.navigate();
      await loginPage.enterEmail('shahidstq@yopmail.com');
      await loginPage.submitEmail();

      const isOtpVisible = await loginPage.isOtpPageDisplayed();
      expect(isOtpVisible).toBeTruthy();

      // Enter OTP with spaces
      await otpPage.enterOtp('12 34 56');
      console.log('✅ Entered OTP with spaces');

      await otpPage.submitOtp();

      // Verify handling
      await page.waitForTimeout(2000);
      const url = await otpPage.getPageUrl();
      const hasError = await otpPage.isErrorDisplayed();

      expect(url.includes('otp') || url.includes('verify') || hasError).toBeTruthy();
      console.log('✅ OTP with spaces was handled correctly');
    });

  });

});