import { test, expect } from '@playwright/test';
import { LoginPage, OtpPage } from '../pages';

/**
 * ✅ POSITIVE TEST CASES
 * Tests for successful login flow with valid data
 */

test.describe('✅ POSITIVE TEST CASES', () => {

  test('TC-001: Valid Email + Valid OTP (123456) → Successful Login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    console.log('\n📍 STEP 1: Navigate to login page');
    await loginPage.navigate();
    await expect(page).toHaveURL(/login/);

    console.log('📍 STEP 2: Enter valid email');
    await loginPage.enterEmail('shahidstq@yopmail.com');

    console.log('📍 STEP 3: Submit email');
    await loginPage.submitEmail();

    console.log('📍 STEP 4: Verify OTP page appears');
    const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
    expect(isOtpDisplayed).toBeTruthy();

    console.log('📍 STEP 5: Enter valid OTP');
    await otpPage.enterOtp('123456');

    console.log('📍 STEP 6: Submit OTP');
    await otpPage.submitOtp();

    console.log('📍 STEP 7: Verify successful login');
    await page.waitForTimeout(3000);

    const currentUrl = await otpPage.getPageUrl();
    const isDashboard = await otpPage.isDashboardDisplayed();

    console.log(`Current URL: ${currentUrl}`);
    console.log(`Dashboard visible: ${isDashboard}`);

    const isSuccessful = isDashboard ||
      currentUrl.includes('dashboard') ||
      currentUrl.includes('home') ||
      !currentUrl.includes('login');

    expect(isSuccessful).toBeTruthy();
    console.log('✅ TEST PASSED: User successfully logged in\n');
  });

});
