import { test, expect } from '@playwright/test';
import { LoginPage, OtpPage, SetupProfilePage } from '../pages';

const TEST_EMAIL = `beneficiary${Date.now()}@yopmail.com`;
const TEST_OTP = '123456';

test.describe('Setup Profile Flow - Beneficiary Only Functional Checks', () => {
  test('TC-Setup-001: Complete signup, OTP, choose beneficiary, verify profile components', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);
    const setupProfilePage = new SetupProfilePage(page);

    await loginPage.navigate();
    await loginPage.enterEmail(TEST_EMAIL);
    await loginPage.submitEmail();

    // A brand-new email takes longer on the backend (account creation + OTP
    // dispatch) than a repeat login, so poll instead of a fixed sleep.
    const otpShown = await loginPage.isOtpPageDisplayed(20000);
    expect(otpShown).toBeTruthy();

    await otpPage.enterOtp(TEST_OTP);
    await otpPage.submitOtp();

    await page.waitForTimeout(3000);

    const roleReady = await setupProfilePage.waitForRoleSelection();
    expect(roleReady).toBeTruthy();

    const selected = await setupProfilePage.chooseBeneficiaryRole();
    expect(selected).toBeTruthy();

    const profileShown = await setupProfilePage.waitForProfileSetupPage();
    expect(profileShown).toBeTruthy();

    const componentCounts = await setupProfilePage.interactWithProfileComponents();
    console.log('Profile component counts:', componentCounts);

    expect(componentCounts.textFields + componentCounts.dateFields + componentCounts.selectFields + componentCounts.checkboxes + componentCounts.radioButtons + componentCounts.textAreas).toBeGreaterThan(0);

    const submitVisible = await setupProfilePage.verifySubmitButtonNotClicked();
    expect(submitVisible).toBeTruthy();
  });
});
