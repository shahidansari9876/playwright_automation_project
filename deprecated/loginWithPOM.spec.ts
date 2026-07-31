import { test, expect } from '@playwright/test';
import { LoginPage, OtpPage } from '../pages';

// Test Data
const VALID_EMAIL = 'shahidstq@yopmail.com';
const VALID_OTP = '123456';
const INVALID_OTP = '000000';
const LOGIN_URL = 'https://testing.thescribebank.com/login?masterOtp=true';

test.describe('🔐 Login and OTP Test Suite', () => {
  
  test.describe('Positive Test Cases', () => {
    
    test('✅ Test 1: Successful Login with Valid Email and Valid OTP', async ({ page }) => {
      console.log('\n🔵 Running: Positive Test - Valid Email and Valid OTP');
      
      const loginPage = new LoginPage(page);
      const otpPage = new OtpPage(page);

      // Navigate to login page
      await loginPage.navigate();
      await loginPage.waitForPageLoad();

      // Enter valid email and submit
      await loginPage.enterEmail(VALID_EMAIL);
      await loginPage.submitEmail();

      // Verify OTP page is displayed
      const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
      expect(isOtpDisplayed).toBeTruthy();
      console.log('✅ OTP page displayed');

      // Enter valid OTP and submit
      await otpPage.enterOtp(VALID_OTP);
      await otpPage.submitOtp();

      // Verify successful login (dashboard or home page)
      await page.waitForTimeout(3000);
      const currentUrl = await otpPage.getPageUrl();
      console.log(`📍 Final URL: ${currentUrl}`);
      
      // Check if redirected from login/otp page
      expect(!currentUrl.includes('login') && !currentUrl.includes('otp') || currentUrl.includes('dashboard') || currentUrl.includes('home')).toBeTruthy();
      console.log('✅ Test PASSED: Successfully logged in');
    });

  });

  test.describe('Negative Test Cases', () => {
    
    test('❌ Test 2: Login Attempt with Valid Email but Invalid OTP', async ({ page }) => {
      console.log('\n🔵 Running: Negative Test - Invalid OTP');
      
      const loginPage = new LoginPage(page);
      const otpPage = new OtpPage(page);

      // Navigate to login page
      await loginPage.navigate();
      await loginPage.waitForPageLoad();

      // Enter valid email and submit
      await loginPage.enterEmail(VALID_EMAIL);
      await loginPage.submitEmail();

      // Verify OTP page is displayed
      const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
      expect(isOtpDisplayed).toBeTruthy();
      console.log('✅ OTP page displayed');

      // Enter INVALID OTP and submit
      await otpPage.enterOtp(INVALID_OTP);
      await otpPage.submitOtp();

      // Verify error or rejection
      await page.waitForTimeout(2000);
      const hasError = await otpPage.isErrorDisplayed();
      const currentUrl = await otpPage.getPageUrl();
      console.log(`📍 Current URL: ${currentUrl}`);
      console.log(`⚠️ Error displayed: ${hasError}`);

      // Should either show error or stay on OTP page
      expect(hasError || currentUrl.includes('otp') || currentUrl.includes('verify')).toBeTruthy();
      console.log('✅ Test PASSED: Invalid OTP was correctly rejected');
    });

    test('❌ Test 3: Login Attempt with Invalid Email Format', async ({ page }) => {
      console.log('\n🔵 Running: Negative Test - Invalid Email Format');
      
      const loginPage = new LoginPage(page);

      // Navigate to login page
      await loginPage.navigate();
      await loginPage.waitForPageLoad();

      // Enter invalid email
      const invalidEmail = 'invalidemail@test';
      await loginPage.enterEmail(invalidEmail);
      await loginPage.submitEmail();

      // Verify rejection or error
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      const hasError = await page.locator('[class*="error"], text=/invalid|Invalid/i').count() > 0;

      console.log(`📍 Current URL: ${currentUrl}`);
      console.log(`⚠️ Error displayed: ${hasError}`);

      // Should stay on login page or show error
      expect(!currentUrl.includes('otp') || hasError).toBeTruthy();
      console.log('✅ Test PASSED: Invalid email was correctly rejected');
    });

    test('❌ Test 4: Login Attempt with Empty Email Field', async ({ page }) => {
      console.log('\n🔵 Running: Negative Test - Empty Email');
      
      const loginPage = new LoginPage(page);

      // Navigate to login page
      await loginPage.navigate();
      await loginPage.waitForPageLoad();

      // Try to submit empty email
      const emailField = await loginPage.getEmailField();
      if (emailField) {
        await emailField.press('Enter');
        console.log('✅ Attempted to submit empty email');
      }

      // Verify rejection
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      const hasError = await page.locator('[class*="error"], text=/required|Required/i').count() > 0;

      console.log(`📍 Current URL: ${currentUrl}`);
      console.log(`⚠️ Error displayed: ${hasError}`);

      // Should stay on login page
      expect(!currentUrl.includes('otp')).toBeTruthy();
      console.log('✅ Test PASSED: Empty email was correctly rejected');
    });

    test('❌ Test 5: Login Attempt with Empty OTP Field', async ({ page }) => {
      console.log('\n🔵 Running: Negative Test - Empty OTP');
      
      const loginPage = new LoginPage(page);
      const otpPage = new OtpPage(page);

      // Navigate to login page and enter email
      await loginPage.navigate();
      await loginPage.waitForPageLoad();
      await loginPage.enterEmail(VALID_EMAIL);
      await loginPage.submitEmail();

      // Verify OTP page
      const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
      expect(isOtpDisplayed).toBeTruthy();
      console.log('✅ OTP page displayed');

      // Try to submit empty OTP
      const otpField = await otpPage.getOtpField();
      if (otpField) {
        await otpField.press('Enter');
        console.log('✅ Attempted to submit empty OTP');
      }

      // Verify rejection
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      const isStillOnOtp = currentUrl.includes('otp') || currentUrl.includes('verify');

      console.log(`📍 Current URL: ${currentUrl}`);
      console.log(`⚠️ Still on OTP page: ${isStillOnOtp}`);

      // Should stay on OTP page
      expect(isStillOnOtp).toBeTruthy();
      console.log('✅ Test PASSED: Empty OTP was correctly rejected');
    });

    test('❌ Test 6: Login Attempt with Invalid Email (Non-existent)', async ({ page }) => {
      console.log('\n🔵 Running: Negative Test - Non-existent Email');
      
      const loginPage = new LoginPage(page);

      // Navigate to login page
      await loginPage.navigate();
      await loginPage.waitForPageLoad();

      // Enter non-existent email
      const nonExistentEmail = 'nonexistent@yopmail.com';
      await loginPage.enterEmail(nonExistentEmail);
      await loginPage.submitEmail();

      // Verify rejection or stay on page
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      const hasError = await page.locator('[class*="error"], text=/not|invalid|Invalid/i').count() > 0;

      console.log(`📍 Current URL: ${currentUrl}`);
      console.log(`⚠️ Error displayed: ${hasError}`);

      // Should either show error or not proceed to OTP
      expect(!currentUrl.includes('otp') || hasError).toBeTruthy();
      console.log('✅ Test PASSED: Non-existent email was correctly rejected');
    });

  });

  test.describe('Edge Cases', () => {
    
    test('⚠️ Test 7: OTP with Special Characters', async ({ page }) => {
      console.log('\n🔵 Running: Edge Case - OTP with Special Characters');
      
      const loginPage = new LoginPage(page);
      const otpPage = new OtpPage(page);

      // Navigate to login page and enter email
      await loginPage.navigate();
      await loginPage.waitForPageLoad();
      await loginPage.enterEmail(VALID_EMAIL);
      await loginPage.submitEmail();

      // Verify OTP page
      const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
      expect(isOtpDisplayed).toBeTruthy();

      // Enter OTP with special characters
      const otpWithSpecialChars = '!@#$%^';
      await otpPage.enterOtp(otpWithSpecialChars);
      await otpPage.submitOtp();

      // Verify rejection
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      
      // Should stay on OTP page or show error
      expect(currentUrl.includes('otp') || currentUrl.includes('verify')).toBeTruthy();
      console.log('✅ Test PASSED: Invalid OTP format was rejected');
    });

    test('⚠️ Test 8: OTP with Less Than Required Digits', async ({ page }) => {
      console.log('\n🔵 Running: Edge Case - OTP with Less Digits');
      
      const loginPage = new LoginPage(page);
      const otpPage = new OtpPage(page);

      // Navigate to login page and enter email
      await loginPage.navigate();
      await loginPage.waitForPageLoad();
      await loginPage.enterEmail(VALID_EMAIL);
      await loginPage.submitEmail();

      // Verify OTP page
      const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
      expect(isOtpDisplayed).toBeTruthy();

      // Enter OTP with less digits
      const shortOtp = '123';
      await otpPage.enterOtp(shortOtp);
      await otpPage.submitOtp();

      // Verify rejection or stay on page
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      
      // Should stay on OTP page or show error
      expect(currentUrl.includes('otp') || currentUrl.includes('verify')).toBeTruthy();
      console.log('✅ Test PASSED: Short OTP was rejected');
    });

  });

});
