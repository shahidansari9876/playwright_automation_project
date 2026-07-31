import { test, expect } from '@playwright/test';

test('SANITY CHECK: Playwright is working', async ({ page }) => {
  console.log('✅ Test framework loaded successfully');
  await page.goto('https://example.com');
  const title = await page.title();
  console.log(`Page title: ${title}`);
  expect(title.length).toBeGreaterThan(0);
  console.log('✅ Sanity check passed');
});
