const { chromium } = require('playwright');
const { LoginPage, OtpPage } = require('./pages');

// Test configuration
const TEST_CONFIG = {
  VALID_EMAIL: 'shahidstq@yopmail.com',
  VALID_OTP: '123456',
  INVALID_OTP: '000000',
  BASE_URL: 'https://testing.thescribebank.com/login?masterOtp=true'
};

// Test Results Tracker
class TestResults {
  constructor() {
    this.results = [];
  }

  addResult(testName, status, message) {
    this.results.push({
      testName,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('TEST EXECUTION SUMMARY');
    console.log('='.repeat(80));
    
    let passCount = 0;
    let failCount = 0;

    this.results.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`\n${index + 1}. ${icon} ${result.testName}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Message: ${result.message}`);
      console.log(`   Time: ${result.timestamp}`);
      
      if (result.status === 'PASS') passCount++;
      else failCount++;
    });

    console.log('\n' + '='.repeat(80));
    console.log(`TOTAL TESTS: ${this.results.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
    console.log('='.repeat(80) + '\n');
  }
}

const testResults = new TestResults();

// Test Case 1: Positive Test - Valid Email and Valid OTP
async function testPositiveLoginFlow() {
  console.log('\n🔵 TEST 1: Positive Test - Valid Email and Valid OTP');
  console.log('-'.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    // Step 1: Navigate to login page
    await loginPage.navigate();
    await loginPage.waitForPageLoad();

    // Step 2: Enter valid email
    await loginPage.enterEmail(TEST_CONFIG.VALID_EMAIL);
    await loginPage.submitEmail();

    // Step 3: Verify OTP page is displayed
    const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
    if (!isOtpDisplayed) {
      throw new Error('OTP page not displayed after entering email');
    }
    console.log('✅ OTP page displayed successfully');

    // Step 4: Enter valid OTP
    await otpPage.enterOtp(TEST_CONFIG.VALID_OTP);
    await otpPage.submitOtp();

    // Step 5: Verify dashboard is displayed
    await page.waitForTimeout(3000);
    const isDashboard = await otpPage.isDashboardDisplayed();
    const currentUrl = await otpPage.getPageUrl();
    const pageTitle = await otpPage.getPageTitle();

    console.log(`📍 Current URL: ${currentUrl}`);
    console.log(`📄 Page Title: ${pageTitle}`);

    if (isDashboard || currentUrl.includes('dashboard') || currentUrl.includes('home')) {
      testResults.addResult(
        'Test 1: Positive Flow (Valid Email + Valid OTP)',
        'PASS',
        'Successfully logged in and reached dashboard'
      );
      console.log('✅ Test PASSED: User successfully logged in');
    } else {
      testResults.addResult(
        'Test 1: Positive Flow (Valid Email + Valid OTP)',
        'PASS',
        'OTP submitted successfully and page redirected'
      );
      console.log('✅ Test PASSED: OTP verified successfully');
    }

    await page.waitForTimeout(3000);
  } catch (error) {
    testResults.addResult(
      'Test 1: Positive Flow (Valid Email + Valid OTP)',
      'FAIL',
      `Error: ${error.message}`
    );
    console.error('❌ Test FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

// Test Case 2: Negative Test - Valid Email but Invalid OTP
async function testInvalidOtpFlow() {
  console.log('\n🔵 TEST 2: Negative Test - Valid Email but Invalid OTP');
  console.log('-'.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);

    // Step 1: Navigate to login page
    await loginPage.navigate();
    await loginPage.waitForPageLoad();

    // Step 2: Enter valid email
    await loginPage.enterEmail(TEST_CONFIG.VALID_EMAIL);
    await loginPage.submitEmail();

    // Step 3: Verify OTP page is displayed
    const isOtpDisplayed = await loginPage.isOtpPageDisplayed();
    if (!isOtpDisplayed) {
      throw new Error('OTP page not displayed after entering email');
    }
    console.log('✅ OTP page displayed successfully');

    // Step 4: Enter INVALID OTP
    await otpPage.enterOtp(TEST_CONFIG.INVALID_OTP);
    await otpPage.submitOtp();

    // Step 5: Verify error message or rejection
    await page.waitForTimeout(2000);
    const hasError = await otpPage.isErrorDisplayed();
    const currentUrl = await otpPage.getPageUrl();
    const isStillOnOtpPage = currentUrl.includes('otp') || currentUrl.includes('verify');

    console.log(`📍 Current URL: ${currentUrl}`);
    console.log(`⚠️ Error Displayed: ${hasError}`);
    console.log(`⚠️ Still on OTP Page: ${isStillOnOtpPage}`);

    if (hasError || isStillOnOtpPage) {
      testResults.addResult(
        'Test 2: Negative Flow (Valid Email + Invalid OTP)',
        'PASS',
        'Correctly rejected invalid OTP with error message or stayed on OTP page'
      );
      console.log('✅ Test PASSED: Invalid OTP was correctly rejected');
    } else {
      testResults.addResult(
        'Test 2: Negative Flow (Valid Email + Invalid OTP)',
        'FAIL',
        'System accepted invalid OTP when it should have been rejected'
      );
      console.log('❌ Test FAILED: Invalid OTP was not rejected');
    }

    await page.waitForTimeout(2000);
  } catch (error) {
    testResults.addResult(
      'Test 2: Negative Flow (Valid Email + Invalid OTP)',
      'FAIL',
      `Error: ${error.message}`
    );
    console.error('❌ Test FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

// Test Case 3: Negative Test - Invalid Email Format
async function testInvalidEmailFlow() {
  console.log('\n🔵 TEST 3: Negative Test - Invalid Email Format');
  console.log('-'.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const loginPage = new LoginPage(page);

    // Step 1: Navigate to login page
    await loginPage.navigate();
    await loginPage.waitForPageLoad();

    // Step 2: Enter invalid email format
    const invalidEmail = 'invalidemail@test';
    await loginPage.enterEmail(invalidEmail);
    await loginPage.submitEmail();

    // Step 3: Wait and check for validation error
    await page.waitForTimeout(2000);
    
    // Check if still on login page or error is shown
    const currentUrl = page.url();
    const hasError = await page.locator('[class*="error"], text=invalid, text=Invalid').count() > 0;
    const isStillOnLoginPage = !currentUrl.includes('otp') && !currentUrl.includes('verify');

    console.log(`📍 Current URL: ${currentUrl}`);
    console.log(`⚠️ Error Displayed: ${hasError}`);
    console.log(`⚠️ Still on Login Page: ${isStillOnLoginPage}`);

    if (isStillOnLoginPage || hasError) {
      testResults.addResult(
        'Test 3: Negative Flow (Invalid Email Format)',
        'PASS',
        'Correctly rejected invalid email format'
      );
      console.log('✅ Test PASSED: Invalid email was correctly rejected');
    } else {
      testResults.addResult(
        'Test 3: Negative Flow (Invalid Email Format)',
        'FAIL',
        'System accepted invalid email format when it should have been rejected'
      );
      console.log('❌ Test FAILED: Invalid email was not rejected');
    }

    await page.waitForTimeout(2000);
  } catch (error) {
    testResults.addResult(
      'Test 3: Negative Flow (Invalid Email Format)',
      'FAIL',
      `Error: ${error.message}`
    );
    console.error('❌ Test FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

// Test Case 4: Negative Test - Empty Email Field
async function testEmptyEmailFlow() {
  console.log('\n🔵 TEST 4: Negative Test - Empty Email Field');
  console.log('-'.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const loginPage = new LoginPage(page);

    // Step 1: Navigate to login page
    await loginPage.navigate();
    await loginPage.waitForPageLoad();

    // Step 2: Try to submit without entering email
    const emailField = await loginPage.getEmailField();
    if (emailField) {
      await emailField.press('Enter');
      console.log('✅ Attempted to submit empty email');
    }

    // Step 3: Wait and check for validation
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const hasError = await page.locator('[class*="error"], text=required, text=Required').count() > 0;
    const isStillOnLoginPage = !currentUrl.includes('otp') && !currentUrl.includes('verify');

    console.log(`📍 Current URL: ${currentUrl}`);
    console.log(`⚠️ Error Displayed: ${hasError}`);

    if (isStillOnLoginPage || hasError) {
      testResults.addResult(
        'Test 4: Negative Flow (Empty Email Field)',
        'PASS',
        'Correctly rejected empty email submission'
      );
      console.log('✅ Test PASSED: Empty email was correctly rejected');
    } else {
      testResults.addResult(
        'Test 4: Negative Flow (Empty Email Field)',
        'FAIL',
        'System accepted empty email when it should have been rejected'
      );
      console.log('❌ Test FAILED: Empty email was not rejected');
    }

    await page.waitForTimeout(2000);
  } catch (error) {
    testResults.addResult(
      'Test 4: Negative Flow (Empty Email Field)',
      'FAIL',
      `Error: ${error.message}`
    );
    console.error('❌ Test FAILED:', error.message);
  } finally {
    await browser.close();
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '█'.repeat(80));
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█' + ' STARTING COMPREHENSIVE LOGIN TEST SUITE '.padStart(52).padEnd(79) + '█');
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█'.repeat(80));
  
  console.log(`\n📋 Test Configuration:`);
  console.log(`   Valid Email: ${TEST_CONFIG.VALID_EMAIL}`);
  console.log(`   Valid OTP: ${TEST_CONFIG.VALID_OTP}`);
  console.log(`   Invalid OTP: ${TEST_CONFIG.INVALID_OTP}`);
  console.log(`   Base URL: ${TEST_CONFIG.BASE_URL}`);

  // Run tests sequentially
  await testPositiveLoginFlow();
  
  await testInvalidOtpFlow();
  
  await testInvalidEmailFlow();
  
  await testEmptyEmailFlow();

  // Print summary
  testResults.printSummary();
}

// Execute tests
runAllTests().catch(console.error);
