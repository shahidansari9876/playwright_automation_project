import { test, expect } from '@playwright/test';
import { LoginPage, OtpPage } from '../pages';

/**
 * ❌ NEGATIVE TEST CASES
 */

test.describe('❌ NEGATIVE TEST CASES', () => {

  test('TC-002: Valid Email + Invalid OTP (000000) → Rejection', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    console.log('\n📍 TEST 2: Invalid OTP rejection');

    // Navigate and enter valid email
    await loginPage.navigate();
    await loginPage.enterEmail('shahidstq@yopmail.com');
    await loginPage.submitEmail();

    // Verify OTP page
    const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
    expect(isOtpDisplayed).toBeTruthy();
    console.log('✅ OTP page displayed');

    // Enter INVALID OTP
    await otpPage.enterOtp('000000');
    console.log('✅ Entered invalid OTP');

    // Submit invalid OTP
    await otpPage.submitOtp();

    // Verify rejection
    await page.waitForTimeout(2000);
    const hasError = await otpPage.isErrorDisplayed();
    const url = await otpPage.getPageUrl();

    console.log(`📍 Error displayed: ${hasError}`);
    console.log(`📍 Current URL: ${url}`);

    // Assert that invalid OTP was rejected
    expect(hasError || url.includes('otp') || url.includes('verify')).toBeTruthy();
    console.log('✅ TEST PASSED: Invalid OTP was correctly rejected');
  });

  test('TC-003: Login failure with invalid email format (invalid@test)', async ({ page }) => {
    const loginPage = new LoginPage(page);

    console.log('\n📍 TEST: Invalid email format rejection');

    await loginPage.navigate();

    // Enter invalid email format
    await loginPage.enterEmail('invalid@test');
    console.log('✅ Entered invalid email format');

    await loginPage.submitEmail();

    // Verify rejection
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasError = await loginPage.isErrorDisplayed();

    console.log(`📍 Error displayed: ${hasError}`);
    console.log(`📍 Current URL: ${url}`);

    // Assert that invalid email was rejected
    expect(!url.includes('otp') || hasError).toBeTruthy();
    console.log('✅ TEST PASSED: Invalid email format was rejected');
  });

  test('TC-004: Login failure with empty email field', async ({ page }) => {
    const loginPage = new LoginPage(page);

    console.log('\n📍 TEST: Empty email field rejection');

    await loginPage.navigate();

    // Try to submit without email
    const emailField = await loginPage.getEmailField();
    expect(emailField).not.toBeNull();

    await emailField.press('Enter');
    console.log('✅ Attempted to submit empty email');

    // Verify rejection
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasError = await loginPage.isErrorDisplayed();

    console.log(`📍 Error displayed: ${hasError}`);
    console.log(`📍 Current URL: ${url}`);

    // Assert that empty email was rejected
    expect(!url.includes('otp') || hasError).toBeTruthy();
    console.log('✅ TEST PASSED: Empty email was rejected');
  });

  test('TC-005: Login failure with empty OTP field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    console.log('\n📍 TEST: Empty OTP field rejection');

    // Navigate and enter email
    await loginPage.navigate();
    await loginPage.enterEmail('shahidstq@yopmail.com');
    await loginPage.submitEmail();

    // Verify OTP page
    const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
    expect(isOtpDisplayed).toBeTruthy();

    // Try to submit without OTP
    const otpField = await otpPage.getOtpField();
    expect(otpField).not.toBeNull();

    await otpField.press('Enter');
    console.log('✅ Attempted to submit empty OTP');

    // Verify rejection
    await page.waitForTimeout(2000);
    const url = await otpPage.getPageUrl();

    console.log(`📍 Current URL: ${url}`);

    // Assert that empty OTP was rejected (should stay on OTP page)
    expect(url.includes('otp') || url.includes('verify')).toBeTruthy();
    console.log('✅ TEST PASSED: Empty OTP was rejected');
  });

  test('TC-006: Login failure with non-existent email (nonexistent@yopmail.com)', async ({ page }) => {
    const loginPage = new LoginPage(page);

    console.log('\n📍 TEST: Non-existent email rejection');

    await loginPage.navigate();

    // Enter non-existent email
    await loginPage.enterEmail('nonexistent@yopmail.com');
    console.log('✅ Entered non-existent email');

    await loginPage.submitEmail();

    // Verify rejection
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasError = await loginPage.isErrorDisplayed();

    console.log(`📍 Error displayed: ${hasError}`);
    console.log(`📍 Current URL: ${url}`);

    // Assert that non-existent email was rejected
    expect(!url.includes('otp') || hasError).toBeTruthy();
    console.log('✅ TEST PASSED: Non-existent email was rejected');
  });

  test('TC-007: Login failure with invalid email format (missing domain)', async ({ page }) => {
    const loginPage = new LoginPage(page);

    console.log('\n📍 TEST: Email without domain rejection');

    await loginPage.navigate();

    // Enter email without domain
    await loginPage.enterEmail('invalidemail@test');
    console.log('✅ Entered email without proper domain');

    await loginPage.submitEmail();

    // Verify rejection
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasError = await loginPage.isErrorDisplayed();

    console.log(`📍 Error displayed: ${hasError}`);
    console.log(`📍 Current URL: ${url}`);

    // Assert rejection
    expect(!url.includes('otp') || hasError).toBeTruthy();
    console.log('✅ TEST PASSED: Invalid email format was rejected');
  });

});
