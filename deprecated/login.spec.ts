import { chromium } from '@playwright/test';

(async () => {
  // Launch Chrome browser
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the URL
    console.log('Navigating to https://testing.thescribebank.com...');
    await page.goto('https://testing.thescribebank.com', { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Click on sign in button
    console.log('Looking for sign in button...');
    const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In"), button:has-text("sign in"), a:has-text("sign in")').first();
    
    if (await signInButton.count() > 0) {
      console.log('Found sign in button, clicking...');
      await signInButton.click();
    } else {
      console.log('Sign in button not found with default selectors, looking for alternatives...');
      // Try other possible selectors
      const alternatives = await page.locator('button, a').all();
      console.log(`Found ${alternatives.length} buttons/links`);
    }

    // Wait for sign in page to load
    await page.waitForTimeout(2000);

    // Find and fill the email box
    console.log('Looking for email field...');
    
    let emailField = null;
    
    // Try different selectors for email field
    if (await page.locator('input[type="email"]').count() > 0) {
      emailField = page.locator('input[type="email"]').first();
      console.log('Found email field with type="email"');
    } else if (await page.locator('input[placeholder*="email" i]').count() > 0) {
      emailField = page.locator('input[placeholder*="email" i]').first();
      console.log('Found email field by placeholder');
    } else if (await page.locator('input[name*="email" i]').count() > 0) {
      emailField = page.locator('input[name*="email" i]').first();
      console.log('Found email field by name attribute');
    } else {
      // Use first input field
      const inputs = await page.locator('input').all();
      if (inputs.length > 0) {
        emailField = inputs[0];
        console.log('Using first input field found');
      }
    }

    if (emailField) {
      // Click on email field to focus it
      await emailField.click();
      console.log('Clicked on email field');

      // Wait a moment
      await page.waitForTimeout(500);

      // Enter the email
      await emailField.fill('shahidstq@yopmail.com');
      console.log('Entered email: shahidstq@yopmail.com');

      // Press Enter
      await emailField.press('Enter');
      console.log('Pressed Enter button');

      // Wait to see the result
      await page.waitForTimeout(3000);
    } else {
      console.log('ERROR: Could not find email field!');
    }

  } catch (error) {
    console.error('Error during automation:', error);
  } finally {
    // Keep browser open for 5 more seconds to see result, then close
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('Browser closed');
  }
})();
