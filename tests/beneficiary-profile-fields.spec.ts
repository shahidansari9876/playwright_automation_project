import { test, expect } from '@playwright/test';
import { LoginPage, OtpPage, SetupProfilePage } from '../pages';

/**
 * Field-level functional test for the Beneficiary "Setup Your Profile" form.
 *
 * This walks every field exactly as manually tested: Basic Details, the
 * Highest Education branch (Below 10th <-> Bachelor's Degree), the Education
 * Status branch (Completed <-> Currently Pursuing), the University Type
 * branch (PU <-> Other), pincode auto-fill, and the Terms checkbox gating
 * the Submit button. The form is deliberately never submitted.
 *
 * Uses the same fixed test account exercised manually throughout this
 * project's test session. Because the profile form is never submitted here,
 * the account never actually completes registration, so it reliably lands
 * back on role selection on every run (confirmed by repeated manual login/
 * logout cycles against this account during manual testing).
 */
const TEST_EMAIL = 'shahidvol12@yopmail.com';
const TEST_OTP = '123456';

test.describe('Beneficiary Profile - Field-Level Functional Checks', () => {
  test('TC-Setup-002: Fill every field and verify conditional UI behaviour', async ({ page }) => {
    // The full login -> OTP -> role-redirect round trip on this environment can
    // take longer than Playwright's 30s default test timeout on its own.
    test.setTimeout(120_000);

    const loginPage = new LoginPage(page);
    const otpPage = new OtpPage(page);
    const profile = new SetupProfilePage(page);

    // --- Login + OTP ---
    // Navigate straight to the masterOtp=true URL (not loginPage.navigate(), which
    // clicks "Sign In" from the homepage and lands on plain /login) — the fixed
    // OTP bypass ('123456') only applies when this query param is present.
    console.log('\n📍 Step 1: Login with masterOtp + verify OTP');
    await page.goto(loginPage.LOGIN_URL, { waitUntil: 'networkidle' });
    await loginPage.enterEmail(TEST_EMAIL);
    await loginPage.submitEmail();

    // A brand-new email takes longer on the backend (account creation + OTP dispatch)
    // than a repeat login, so give this more headroom than the 10s default.
    const otpShown = await loginPage.isOtpPageDisplayed(20000);
    expect(otpShown).toBeTruthy();

    await otpPage.enterOtp(TEST_OTP);
    await otpPage.submitOtp();

    // --- Role selection -> Beneficiary ---
    console.log('📍 Step 2: Choose Beneficiary role and register');
    const roleReady = await profile.waitForRoleSelection();
    expect(roleReady).toBeTruthy();

    const roleSelected = await profile.chooseBeneficiaryRole();
    expect(roleSelected).toBeTruthy();
    await profile.clickRegisterAsBeneficiary();

    const profileShown = await profile.waitForProfileSetupPage();
    expect(profileShown).toBeTruthy();

    // --- Basic Details ---
    console.log('📍 Step 3: Basic details (name, gender, DOB)');
    await profile.fillBasicDetails('Shahid', 'Volunteer');
    await profile.selectGender('Male');

    await profile.selectDateOfBirthYear('2000');
    expect(await profile.isDateOfBirthDayEnabled()).toBeFalsy(); // Day must stay disabled until Month is picked too
    await profile.selectDateOfBirthMonth('Jan');
    expect(await profile.isDateOfBirthDayEnabled()).toBeTruthy();
    await profile.selectDateOfBirthDay('15');

    // --- Highest Education branch ---
    console.log('📍 Step 4: Highest Education conditional fields (Below 10th -> Bachelor\'s Degree)');
    await profile.selectHighestEducation('Below 10th Standard');
    expect(await profile.isDegreeTypeFieldVisible()).toBeFalsy();
    expect(await profile.isParentGuardianFieldsVisible()).toBeTruthy();

    await profile.selectHighestEducation(/Bachelor.?s Degree/i);
    expect(await profile.isDegreeTypeFieldVisible()).toBeTruthy();
    expect(await profile.isParentGuardianFieldsVisible()).toBeFalsy();

    await profile.selectDegreeType('4-Year');

    // --- Education Status branch ---
    console.log('📍 Step 5: Education Status conditional field (Completed -> Currently Pursuing)');
    await profile.selectEducationStatus('Completed', 'Completed');
    expect(await profile.isYearOfStudyFieldVisible()).toBeFalsy();

    await profile.selectEducationStatus('Completed', 'Currently Pursuing');
    expect(await profile.isYearOfStudyFieldVisible()).toBeTruthy();

    await profile.selectPassingYear('2027');

    // --- University Type branch ---
    console.log('📍 Step 6: University Type conditional fields (PU -> Other -> PU)');
    // Fresh sessions start on the "Select Board/University" placeholder (not "PU" —
    // that was leftover client-side state from an earlier manual browser session).
    await profile.selectUniversityType('Select Board/University', 'Other');
    expect(await profile.isBoardUniversityFreeTextVisible()).toBeTruthy();
    expect(await profile.isStudentTypeFieldVisible()).toBeFalsy();

    await profile.selectUniversityType('Other', 'PU');
    expect(await profile.isStudentTypeFieldVisible()).toBeTruthy();

    await profile.selectStudentType('Affiliated College');
    await profile.selectSchoolCollege(/D\.A\.V\. Post Graduate College/i);
    await profile.fillPuEnrollmentNumber('PU2027SB12345');

    // --- Current Address (pincode auto-fill) ---
    console.log('📍 Step 7: Pincode auto-fill for City/State');
    await profile.fillPincode('160019');
    // The city/state auto-fill depends on a live pincode-lookup call, which can
    // take longer than expect.poll's 5s default under real network conditions.
    await expect.poll(() => profile.getAutoFilledCity(), { timeout: 15000 }).toBe('Chandigarh');
    await expect.poll(() => profile.getAutoFilledState(), { timeout: 15000 }).toContain('Chandigarh');
    await profile.fillFullAddress('House No. 123, Sector 19, Chandigarh');

    // --- Terms checkbox gates Submit ---
    console.log('📍 Step 8: Terms checkbox toggling gates the Submit button');
    expect(await profile.isSubmitEnabled()).toBeFalsy();

    await profile.toggleAgreementCheckbox();
    expect(await profile.isAgreementChecked()).toBeTruthy();
    expect(await profile.isSubmitEnabled()).toBeTruthy();

    await profile.toggleAgreementCheckbox();
    expect(await profile.isAgreementChecked()).toBeFalsy();
    expect(await profile.isSubmitEnabled()).toBeFalsy();

    // Intentionally not submitting the form — this test only verifies field-level
    // and conditional UI behaviour, matching the manual functional test session.
  });
});
