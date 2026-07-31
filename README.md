# Login Test Suite with Page Object Model

This comprehensive test suite includes positive, negative, and edge case test scenarios for the login and OTP flow.

## 📋 Project Structure

```
├── pages/
│   └── loginPage.js          # Page Object Model for Login and OTP pages
├── tests/
│   └── loginWithPOM.spec.ts  # Playwright test cases using POM
├── testLogin.js              # Standalone Node.js test runner
├── login.js                  # Quick automation script
├── playwright.config.ts      # Playwright configuration
└── README.md                 # This file
```

## 🔍 Page Object Model (POM)

### LoginPage Class
Methods for interacting with the login page:
- `navigate()` - Navigate to the login URL
- `waitForPageLoad()` - Wait for page to load
- `getEmailField()` - Get email input element
- `enterEmail(email)` - Enter email address
- `submitEmail()` - Submit email and proceed to OTP page
- `isOtpPageDisplayed()` - Check if OTP page is displayed

### OtpPage Class
Methods for interacting with the OTP verification page:
- `getOtpField()` - Get OTP input element
- `enterOtp(otp)` - Enter OTP code
- `submitOtp()` - Submit OTP
- `isDashboardDisplayed()` - Check if dashboard/home page is displayed
- `isErrorDisplayed()` - Check if error message is shown
- `getPageUrl()` - Get current page URL
- `getPageTitle()` - Get current page title

## ✅ Test Cases

### Positive Test Cases
1. **Valid Email + Valid OTP (123456)** - Should successfully login and reach dashboard

### Negative Test Cases
2. **Valid Email + Invalid OTP (000000)** - Should show error or reject login
3. **Invalid Email Format** - Should reject during email validation
4. **Empty Email Field** - Should show validation error
5. **Empty OTP Field** - Should show validation error
6. **Non-existent Email** - Should reject or show error
7. **OTP with Special Characters** - Should reject invalid format
8. **OTP with Less Than Required Digits** - Should reject incomplete OTP

## 📧 Test Credentials

- **Valid Email:** shahidstq@yopmail.com
- **Valid OTP:** 123456
- **Invalid OTP:** 000000
- **Login URL:** https://testing.thescribebank.com/login?masterOtp=true

## 🚀 How to Run Tests

### Option 1: Run with Playwright Test Framework (Recommended)
```bash
# Run all tests
npx playwright test tests/loginWithPOM.spec.ts

# Run with headed browser (see browser actions)
npx playwright test tests/loginWithPOM.spec.ts --headed

# Run specific test
npx playwright test tests/loginWithPOM.spec.ts --grep "Valid Email"

# Run with debug mode
npx playwright test tests/loginWithPOM.spec.ts --debug

# Generate and view HTML report
npx playwright test tests/loginWithPOM.spec.ts
npx playwright show-report
```

### Option 2: Run Standalone Test Script
```bash
# Run comprehensive test suite with Node.js
node testLogin.js
```

### Option 3: Quick Automation Script
```bash
# Run quick login automation
node login.js
```

## 📊 Test Execution Output

The test suite provides:
- ✅ PASS/FAIL status for each test
- 📊 Detailed test execution summary
- 🔍 Current URL and page state at each step
- ⏱️ Timestamp of each test execution
- 📝 Descriptive error messages for debugging

## 🔧 Configuration

Edit `playwright.config.ts` to customize:
- Browser types (chromium, firefox, webkit)
- Test timeout
- Headless/headed mode
- Retry settings
- Screenshot/video recording options

## 🐛 Debugging

### Enable Debug Mode
```bash
npx playwright test tests/loginWithPOM.spec.ts --debug
```

### View Test Report
```bash
npx playwright show-report
```

### Check Screenshots
Screenshots are saved in `test-results/` directory for failed tests.

## 📝 Test Scenarios Detail

### Test 1: Successful Login
1. Navigate to login URL with masterOtp=true parameter
2. Enter valid email (shahidstq@yopmail.com)
3. Submit email → redirects to OTP page
4. Enter valid OTP (123456)
5. Submit OTP → should reach dashboard

### Test 2: Invalid OTP Rejection
1. Navigate to login URL
2. Enter valid email
3. Reach OTP page
4. Enter invalid OTP (000000)
5. Submit → should show error or stay on OTP page

### Test 3: Email Validation
1. Navigate to login URL
2. Enter invalid email format
3. Should reject during validation (no OTP page)

### Test 4-8: Edge Cases
- Empty fields validation
- Non-existent emails
- Special characters in OTP
- Incomplete OTP entry

## 🎯 Expected Results

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Valid Email + Valid OTP | shahidstq@yopmail.com / 123456 | Login Success |
| Valid Email + Invalid OTP | shahidstq@yopmail.com / 000000 | Error/Rejection |
| Invalid Email | invalidemail@test | Validation Error |
| Empty Email | (blank) | Required Error |
| Empty OTP | (blank) | Required Error |
| Non-existent Email | nonexistent@yopmail.com | Error/Rejection |
| Special Char OTP | !@#$%^ | Invalid Format Error |
| Short OTP | 123 | Incomplete Error |

## 🔐 Security Notes

- Valid OTP should be used only in authorized environments
- Email addresses used are disposable test accounts
- Never commit real credentials to version control
- Use environment variables for sensitive data in production

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Best Practices](https://playwright.dev/docs/pom)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)

## ✨ Features

- ✅ Comprehensive test coverage with positive and negative cases
- ✅ Page Object Model for maintainability
- ✅ Detailed logging and reporting
- ✅ Support for multiple browsers (Chrome, Firefox, Safari)
- ✅ Screenshot/video capture on failures
- ✅ Parallel test execution support
- ✅ Multiple selector strategies for element identification
- ✅ Error handling and validation checks

---

**Last Updated:** 2026-07-06
**Test Suite Version:** 1.0# playwright_automation
