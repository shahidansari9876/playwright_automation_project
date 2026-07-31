const { chromium } = require('playwright');

(async () => {
  // Launch Chrome browser
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the URL
    console.log('🌐 Navigating to https://testing.thescribebank.com...');
    await page.goto('https://testing.thescribebank.com', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Click on sign in button
    console.log('🔍 Looking for sign in button...');
    
    // Try multiple selectors for sign in button
    let signInClicked = false;
    
    const selectors = [
      'button:has-text("Sign In")',
      'button:has-text("sign in")',
      'a:has-text("Sign In")',
      'a:has-text("sign in")',
      '[data-testid="signin-button"]',
      '[id*="signin"]',
      '[id*="login"]',
      'button:nth-child(1)'
    ];

    for (const selector of selectors) {
      try {
        if (await page.locator(selector).count() > 0) {
          console.log(`✅ Found sign in button with selector: ${selector}`);
          await page.locator(selector).first().click();
          signInClicked = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!signInClicked) {
      console.log('⚠️  Could not find sign in button, proceeding anyway...');
    }

    // Wait for sign in page to load or email form to appear
    await page.waitForTimeout(2000);

    // Find and fill the email box
    console.log('🔍 Looking for email field...');
    
    let emailField = null;
    
    // Try different selectors for email field
    const emailSelectors = [
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[name*="email" i]',
      'input[id*="email" i]',
      'input'
    ];

    for (const selector of emailSelectors) {
      try {
        if (await page.locator(selector).count() > 0) {
          emailField = page.locator(selector).first();
          console.log(`✅ Found email field with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (emailField) {
      // Click on email field to focus it
      await emailField.click();
      console.log('✅ Clicked on email field');

      // Wait a moment
      await page.waitForTimeout(500);

      // Clear any existing text and enter the email
      await emailField.fill('shahidstq@yopmail.com');
      console.log('✅ Entered email: shahidstq@yopmail.com');

      // Press Enter
      await emailField.press('Enter');
      console.log('✅ Pressed Enter button');

      // Wait to see the result
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ ERROR: Could not find email field!');
    }

    console.log('✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Error during automation:', error.message);
  } finally {
    // Keep browser open for a few seconds to see result
    console.log('🔄 Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('🔴 Browser closed');
  }
})();
