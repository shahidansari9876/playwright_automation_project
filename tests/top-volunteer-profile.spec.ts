import { test, expect, Page } from '@playwright/test';
import { LoginPage, OtpPage, ProfilePage } from '../pages';

/**
 * Coverage for the "Top Volunteers" sidebar widget on the beneficiary
 * profile page (/beneficiary/profile): for each listed volunteer, capture
 * the name shown *before* clicking, follow the link to their public
 * /profile/:id page, and verify that page actually shows a matching,
 * populated profile rather than an error.
 *
 * Uses expect.soft() so every entry is checked even after an earlier one
 * fails — with multiple volunteers listed, a single hard failure would
 * otherwise abort the test before the remaining entries are checked. The
 * overall test still reports as failed if any entry failed. A screenshot is
 * captured for every entry that doesn't resolve and attached to the HTML
 * report via testInfo.attach(), in addition to Playwright's own on-failure
 * screenshot (configured in playwright.config.ts).
 */
const TEST_OTP = '123456';
const BENEFICIARY_EMAIL = 'shahidstq@yopmail.com';

async function loginAs(page: Page, email: string): Promise<void> {
  const loginPage = new LoginPage(page);
  const otpPage = new OtpPage(page);
  await page.goto(loginPage.LOGIN_URL, { waitUntil: 'networkidle' });
  await loginPage.enterEmail(email);
  await loginPage.submitEmail();
  expect(await loginPage.isOtpPageDisplayed(20000)).toBeTruthy();
  await otpPage.enterOtp(TEST_OTP);
  await otpPage.submitOtp();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Beneficiary Profile: Top Volunteers link verification', () => {
  test.setTimeout(180_000);

  test('Each Top Volunteer entry opens a matching, populated profile page', async ({ page }, testInfo) => {
    await loginAs(page, BENEFICIARY_EMAIL);
    const profile = new ProfilePage(page);
    await profile.navigateAsBeneficiary();

    // count() doesn't auto-wait — this sidebar list renders a beat after
    // networkidle settles, so reading count() immediately can race it and
    // see 0 (confirmed live: the error snapshot from that race showed the
    // fully-rendered list moments later).
    const links = profile.getTopVolunteerLinks();
    await links.first().waitFor({ state: 'visible', timeout: 15000 });
    const count = await links.count();
    console.log(`\n📍 Found ${count} entries in Top Volunteers`);
    expect(count, 'Expected at least one Top Volunteer entry to check').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await test.step(`Top Volunteer #${i + 1}`, async () => {
        // Re-navigate fresh each iteration rather than relying on
        // page.goBack() after the previous entry's click.
        await profile.navigateAsBeneficiary();
        const link = profile.getTopVolunteerLinks().nth(i);
        await link.waitFor({ state: 'visible', timeout: 15000 });

        const nameBeforeClick = (await link.locator('p').first().textContent())?.trim() ?? '';
        const href = await link.getAttribute('href');
        console.log(`📍 Checking "${nameBeforeClick}" -> ${href}`);
        expect(nameBeforeClick, 'Top Volunteer entry should show a name before it is clicked').not.toBe('');

        await link.click();
        await page.waitForLoadState('networkidle');

        // Race the two possible outcomes rather than checking one then the
        // other with isVisible() — isVisible() doesn't wait, so checking
        // "Volunteer not found" immediately after networkidle can miss it if
        // it renders a beat later (confirmed live: mainText read moments
        // afterward showed "Volunteer not found" even though the immediate
        // isVisible() check had just reported false).
        const notFoundLocator = page.getByText('Volunteer not found');
        const nameHeadingLocator = page.getByRole('heading', { name: nameBeforeClick });
        const outcome = await Promise.race([
          notFoundLocator.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'not-found' as const),
          nameHeadingLocator.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'found' as const),
        ]).catch(() => 'timeout' as const);

        if (outcome !== 'found') {
          console.log(
            `❌ "${nameBeforeClick}" (${href}) — profile page did not show a "${nameBeforeClick}" heading (outcome: ${outcome})`
          );
          const screenshot = await page.screenshot({ fullPage: true });
          await testInfo.attach(`top-volunteer-not-found-${i + 1}`, { body: screenshot, contentType: 'image/png' });
        }
        expect
          .soft(outcome, `Profile page for "${nameBeforeClick}" (${href}) should show a heading with their name, not "Volunteer not found"`)
          .toBe('found');

        if (outcome === 'found') {
          console.log(`📍 Verifying the profile page shows some details for "${nameBeforeClick}"`);
          const mainText = (await page.locator('main').textContent())?.trim() ?? '';
          console.log(`📍 Profile page content length: ${mainText.length} characters`);
          expect.soft(mainText.length, `Profile page for "${nameBeforeClick}" should show more than just a bare heading`).toBeGreaterThan(nameBeforeClick.length);
        }
      });
    }
  });
});
