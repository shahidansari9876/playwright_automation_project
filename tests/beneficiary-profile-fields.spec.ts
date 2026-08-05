import { test, expect, Page } from '@playwright/test';
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
const TEST_EMAIL = 'benef1785409366826@yopmail.com'; // testing email
// const TEST_EMAIL = 'puflowsben1@yopmail.com'; // production email 
const TEST_OTP = '123456';

const BACHELORS = "Bachelor's Degree (B.A/B.Sc/B.Com/B.Tech/BE)";

/**
 * Which conditional block each Highest Education value reveals.
 * Captured field-by-field from the live testing environment — note that
 * Degree Type is driven by exactly ONE of the thirteen values, and that the
 * last two drop the Education Status field entirely.
 */
const EDUCATION_MATRIX: ReadonlyArray<{
  value: string;
  degreeType: boolean;
  educationStatus: boolean;
  parentGuardian: boolean;
}> = [
  { value: 'Below 10th Standard',                        degreeType: false, educationStatus: true,  parentGuardian: true  },
  { value: '10th Standard (SSC/SSLC)',                   degreeType: false, educationStatus: true,  parentGuardian: true  },
  { value: '12th Standard (HSC/Intermediate)',           degreeType: false, educationStatus: true,  parentGuardian: false },
  { value: 'Diploma',                                    degreeType: false, educationStatus: true,  parentGuardian: false },
  { value: 'ITI (Industrial Training Institute)',        degreeType: false, educationStatus: true,  parentGuardian: false },
  { value: BACHELORS,                                    degreeType: true,  educationStatus: true,  parentGuardian: false },
  { value: "Professional Bachelor's (MBBS/BDS/LLB/B.Arch)", degreeType: false, educationStatus: true, parentGuardian: false },
  { value: "Master's Degree (M.A/M.Sc/M.Com/M.Tech/ME)",  degreeType: false, educationStatus: true,  parentGuardian: false },
  { value: "Professional Master's (MBA/MCA/LLM/MD/MS)",   degreeType: false, educationStatus: true,  parentGuardian: false },
  { value: 'M.Phil',                                     degreeType: false, educationStatus: true,  parentGuardian: false },
  { value: 'Ph.D/Doctorate',                             degreeType: false, educationStatus: true,  parentGuardian: false },
  { value: 'Post Doctorate',                             degreeType: false, educationStatus: false, parentGuardian: false },
  { value: 'Other',                                      degreeType: false, educationStatus: false, parentGuardian: false },
];

/**
 * Log in with the master-OTP bypass and land on the Beneficiary profile form.
 *
 * Navigates straight to the masterOtp=true URL rather than going through
 * loginPage.navigate() — the fixed OTP only works when that query param is present.
 */
async function openBeneficiaryProfileForm(page: Page): Promise<SetupProfilePage> {
  const loginPage = new LoginPage(page);
  const otpPage = new OtpPage(page);
  const profile = new SetupProfilePage(page);

  console.log('📍 Step 1: Login with masterOtp + verify OTP');
  await page.goto(loginPage.LOGIN_URL, { waitUntil: 'networkidle' });
  await loginPage.enterEmail(TEST_EMAIL);
  await loginPage.submitEmail();
  expect(await loginPage.isOtpPageDisplayed(20000)).toBeTruthy();
  await otpPage.enterOtp(TEST_OTP);
  await otpPage.submitOtp();

  console.log('📍 Step 2: Choose Beneficiary role and register');
  expect(await profile.waitForRoleSelection()).toBeTruthy();
  expect(await profile.chooseBeneficiaryRole()).toBeTruthy();
  await profile.clickRegisterAsBeneficiary();
  expect(await profile.waitForProfileSetupPage()).toBeTruthy();

  return profile;
}

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

  // ─────────────────────────────────────────────────────────────────────────
  // POSITIVE 1
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-Setup-003 (positive): every Highest Education value drives the right conditional block', async ({ page }) => {
    test.setTimeout(240_000);
    const profile = await openBeneficiaryProfileForm(page);

    // --- Step 3: Basic details, filled -> cleared -> refilled ---
    console.log('📍 Step 3: Basic details fill / clear / refill');
    await profile.fillBasicDetails('Shahid', 'Volunteer');
    expect(await profile.getFirstName()).toBe('Shahid');
    expect(await profile.getLastName()).toBe('Volunteer');

    await profile.clearBasicDetails();
    expect(await profile.getFirstName()).toBe('');
    expect(await profile.getLastName()).toBe('');

    await profile.fillBasicDetails('Refilled', 'Beneficiary');
    expect(await profile.getFirstName()).toBe('Refilled');
    expect(await profile.getLastName()).toBe('Beneficiary');

    await profile.selectGender('Male');
    expect(await profile.getComboboxText('Gender')).toBe('Male');

    // Day stays disabled until BOTH Year and Month are chosen.
    await profile.selectDateOfBirthYear('2000');
    expect(await profile.isDateOfBirthDayEnabled()).toBeFalsy();
    await profile.selectDateOfBirthMonth('Jan');
    expect(await profile.isDateOfBirthDayEnabled()).toBeTruthy();
    await profile.selectDateOfBirthDay('15');
    expect(await profile.getDateOfBirth()).toEqual({ year: '2000', month: '1', day: '15' });

    // --- Step 4: all thirteen Highest Education values ---
    console.log('📍 Step 4: Highest Education conditional fields — all 13 values');
    for (const row of EDUCATION_MATRIX) {
      await profile.selectHighestEducation(row.value);

      const labels = await profile.getVisibleFieldLabels();
      const shows = (label: string) => labels.some(l => l.toLowerCase().includes(label.toLowerCase()));

      expect(shows('Degree Type'), `Degree Type for "${row.value}"`).toBe(row.degreeType);
      expect(shows('Education Status'), `Education Status for "${row.value}"`).toBe(row.educationStatus);
      expect(shows('Parent/Guardian'), `Parent/Guardian for "${row.value}"`).toBe(row.parentGuardian);

      console.log(
        `   ✓ ${row.value.padEnd(45)} degree=${row.degreeType} status=${row.educationStatus} parent=${row.parentGuardian}`
      );
    }

    // Degree Type belongs to Bachelor's alone — confirm its options and that it
    // resets (rather than silently retaining a stale value) across a round trip.
    console.log('📍 Step 4b: Degree Type options + reset on round trip');
    await profile.selectHighestEducation(BACHELORS);
    expect(await profile.isDegreeTypeFieldVisible()).toBeTruthy();
    expect(await profile.getComboboxOptions('Degree Type')).toEqual(['2-Year', '3-Year', '4-Year', '5-Year']);

    await profile.selectDegreeType('4-Year');
    expect(await profile.getComboboxText('Degree Type')).toBe('4-Year');

    await profile.selectHighestEducation('Post Doctorate');
    expect(await profile.isFieldHidden('Degree Type')).toBeTruthy();

    await profile.selectHighestEducation(BACHELORS);
    expect(await profile.isDegreeTypeFieldVisible()).toBeTruthy();
    expect(await profile.getComboboxText('Degree Type')).toBe('Select degree type');

    await profile.selectDegreeType('3-Year');
    expect(await profile.getComboboxText('Degree Type')).toBe('3-Year');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // POSITIVE 2
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-Setup-004 (positive): education status, PU/Other round trip, pincode and terms gating', async ({ page }) => {
    // The widest test in the file: two PU college look-ups and two pincode
    // look-ups all hit the live backend, on top of ~30 combobox interactions.
    test.setTimeout(360_000);
    const profile = await openBeneficiaryProfileForm(page);

    console.log('📍 Step 3: Basic details');
    await profile.fillBasicDetails('Shahid', 'Volunteer');
    await profile.selectGender('Female');
    await profile.selectDateOfBirthYear('2001');
    await profile.selectDateOfBirthMonth('Mar');
    await profile.selectDateOfBirthDay('9');

    await profile.selectHighestEducation(BACHELORS);
    await profile.selectDegreeType('4-Year');

    // --- Step 5: Education Status <-> Year of Study, both directions ---
    console.log('📍 Step 5: Education Status conditional field, both directions');
    await profile.selectEducationStatus('Completed', 'Completed');
    expect(await profile.isFieldHidden('Year of Study')).toBeTruthy();

    await profile.selectEducationStatus('Completed', 'Currently Pursuing');
    expect(await profile.isYearOfStudyFieldVisible()).toBeTruthy();

    // Year of Study is a second-order conditional: its option list is generated
    // from the Degree Type length, so an N-Year degree must offer exactly N years.
    console.log('📍 Step 5b: Year of Study options track the Degree Type length');
    const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
    for (const length of [2, 3, 4, 5]) {
      await profile.selectDegreeType(`${length}-Year`);
      expect(
        await profile.getComboboxOptions('Year of Study'),
        `Year of Study options for a ${length}-Year degree`
      ).toEqual(YEAR_LABELS.slice(0, length));
      console.log(`   ✓ ${length}-Year degree → ${length} year options`);
    }

    // Shrinking the degree must drop a now-invalid selection rather than keep it.
    await profile.selectDegreeType('5-Year');
    await profile.selectYearOfStudy('5th Year');
    expect(await profile.getComboboxText('Year of Study')).toBe('5th Year');

    await profile.selectDegreeType('2-Year');
    expect(await profile.getComboboxText('Year of Study')).toBe('Select year');
    await profile.selectYearOfStudy('2nd Year');
    expect(await profile.getComboboxText('Year of Study')).toBe('2nd Year');

    // Going back to Completed must remove it again, not merely blank it.
    await profile.selectEducationStatus('Currently Pursuing', 'Completed');
    expect(await profile.isFieldHidden('Year of Study')).toBeTruthy();

    // Restore a 4-Year degree for the remainder of the run.
    await profile.selectDegreeType('4-Year');

    await profile.selectPassingYear('2027');
    expect(await profile.getComboboxText('Passing Year')).toBe('2027');

    // --- Step 6: University Type PU -> Other -> PU ---
    console.log('📍 Step 6: University Type PU -> Other -> PU');
    expect(await profile.getComboboxOptions('University Type')).toEqual(['PU', 'Other']);

    // PU first: autocomplete school picker, student type, enrollment number.
    await profile.selectUniversityType('Select Board/University', 'PU');
    expect(await profile.isStudentTypeFieldVisible()).toBeTruthy();
    expect(await profile.isSchoolSuggestionsButtonVisible()).toBeTruthy();
    expect(await profile.getComboboxOptions('Student Type')).toEqual([
      'Affiliated College',
      'CDOE',
      'Private Candidate',
      'Teaching Department',
    ]);
    await profile.selectStudentType('Affiliated College');
    await profile.selectSchoolCollege(/D\.A\.V\. Post Graduate College/i);
    await profile.fillPuEnrollmentNumber('PU2027SB12345');
    expect(await profile.getPuEnrollmentNumber()).toBe('PU2027SB12345');

    // Other: free-text board/university plus a free-text school name, and the
    // PU-only controls must be gone.
    await profile.selectUniversityType('PU', 'Other');
    expect(await profile.isBoardUniversityFreeTextVisible()).toBeTruthy();
    expect(await profile.isStudentTypeFieldVisible()).toBeFalsy();
    expect(await profile.isSchoolSuggestionsButtonVisible()).toBeFalsy();

    // Fill -> clear -> refill both free-text institution fields.
    await profile.fillBoardUniversity('CBSE Board');
    await profile.fillSchoolCollegeName('Green Valley Public School');
    expect(await profile.getBoardUniversity()).toBe('CBSE Board');
    expect(await profile.getSchoolCollegeName()).toBe('Green Valley Public School');

    await profile.fillBoardUniversity('');
    await profile.fillSchoolCollegeName('');
    expect(await profile.getBoardUniversity()).toBe('');
    expect(await profile.getSchoolCollegeName()).toBe('');

    await profile.fillBoardUniversity('Punjab School Education Board');
    await profile.fillSchoolCollegeName('St. Xavier Senior Secondary School');
    expect(await profile.getBoardUniversity()).toBe('Punjab School Education Board');
    expect(await profile.getSchoolCollegeName()).toBe('St. Xavier Senior Secondary School');

    // Back to PU: PU-only controls return and the free-text board field goes away.
    await profile.selectUniversityType('Other', 'PU');
    expect(await profile.isStudentTypeFieldVisible()).toBeTruthy();
    expect(await profile.isBoardUniversityFreeTextVisible()).toBeFalsy();

    // ── Known inconsistency, asserted so the suite documents current behaviour ──
    // The round trip clears Student Type back to its placeholder, but the school
    // name is shared state across the two branches: the free text typed into the
    // "Other" branch is carried straight into the PU college autocomplete, so the
    // user lands on PU pre-filled with a school that is not a PU college at all.
    // Verified on 2026-08-01.
    expect(await profile.getComboboxText('Student Type')).toBe('Select student type');
    expect(await profile.getPuSchoolSearchValue()).toBe('St. Xavier Senior Secondary School');
    console.warn(
      '   ⚠️  Student Type reset on the PU round trip, but the non-PU school name typed on the ' +
        '"Other" branch carried over into the PU college autocomplete.'
    );

    await profile.selectStudentType('CDOE');
    expect(await profile.getComboboxText('Student Type')).toBe('CDOE');

    // Re-query with a fresh search term so the retained text cannot narrow the list.
    await profile.selectSchoolCollege(/D\.A\.V\. College, Hoshiarpur/i, 'D.A.V. College, Hoshiarpur');
    expect(await profile.getPuSchoolSearchValue()).toContain('D.A.V. College, Hoshiarpur');

    await profile.fillPuEnrollmentNumber('PU2027SB99999');
    expect(await profile.getPuEnrollmentNumber()).toBe('PU2027SB99999');

    // --- Step 7: pincode auto-fill, filled -> cleared -> refilled ---
    console.log('📍 Step 7: Pincode auto-fill for City/State (fill / clear / refill)');
    await profile.fillPincode('160019');
    await expect.poll(() => profile.getAutoFilledCity(), { timeout: 20000 }).toBe('Chandigarh');
    await expect.poll(() => profile.getAutoFilledState(), { timeout: 20000 }).toContain('Chandigarh');

    await profile.clearPincode();
    expect(await profile.getPincode()).toBe('');

    // A different pincode must re-resolve to a different city, proving the
    // lookup re-runs instead of leaving the first result cached in the field.
    await profile.fillPincode('110001');
    await expect.poll(() => profile.getAutoFilledCity(), { timeout: 20000 }).not.toBe('Chandigarh');
    const secondCity = await profile.getAutoFilledCity();
    expect(secondCity.length).toBeGreaterThan(0);
    console.log(`   ✓ 110001 resolved to "${secondCity}"`);

    await profile.fillFullAddress('House No. 123, Sector 19, Chandigarh');
    expect(await profile.getFullAddress()).toBe('House No. 123, Sector 19, Chandigarh');

    // --- Step 8: terms checkbox gating, exercised twice ---
    console.log('📍 Step 8: Terms checkbox toggling gates the Submit button');
    expect(await profile.isAgreementChecked()).toBeFalsy();
    expect(await profile.isSubmitEnabled()).toBeFalsy();

    for (const pass of [1, 2]) {
      await profile.toggleAgreementCheckbox();
      expect(await profile.isAgreementChecked(), `checked on pass ${pass}`).toBeTruthy();
      expect(await profile.isSubmitEnabled(), `submit enabled on pass ${pass}`).toBeTruthy();

      await profile.toggleAgreementCheckbox();
      expect(await profile.isAgreementChecked(), `unchecked on pass ${pass}`).toBeFalsy();
      expect(await profile.isSubmitEnabled(), `submit disabled on pass ${pass}`).toBeFalsy();
    }

    // Deliberately never submitted — this is a field-behaviour test only.
  });

  // ─────────────────────────────────────────────────────────────────────────
  // NEGATIVE
  // ─────────────────────────────────────────────────────────────────────────
  test('TC-Setup-005 (negative): invalid input is rejected and never auto-fills', async ({ page }) => {
    test.setTimeout(240_000);
    const profile = await openBeneficiaryProfileForm(page);

    console.log('📍 Negative 1: Date of Birth Day stays locked without Year + Month');
    expect(await profile.isDateOfBirthDayEnabled()).toBeFalsy();
    await profile.selectDateOfBirthYear('1999');
    expect(await profile.isDateOfBirthDayEnabled()).toBeFalsy(); // year alone is not enough
    await profile.selectDateOfBirthMonth('Feb');
    expect(await profile.isDateOfBirthDayEnabled()).toBeTruthy();

    console.log('📍 Negative 2: Degree Type must NOT appear for a non-Bachelor qualification');
    await profile.selectHighestEducation("Master's Degree (M.A/M.Sc/M.Com/M.Tech/ME)");
    expect(await profile.isDegreeTypeFieldVisible()).toBeFalsy();

    console.log('📍 Negative 3: Pincode rejects non-numeric input outright');
    await profile.fillPincode('abcdef');
    expect(await profile.getPincode()).toBe(''); // letters are stripped by the input

    await profile.fillPincode('16A0!9');
    expect(await profile.getPincode()).toBe('1609'); // only the digits survive

    console.log('📍 Negative 4: an incomplete pincode triggers no lookup');
    await profile.clearPincode();
    await profile.fillPincode('16');
    await page.waitForTimeout(5000); // give any lookup that would fire time to land
    expect(await profile.getAutoFilledCity()).toBe('');

    console.log('📍 Negative 5: an unresolvable pincode reports an error and leaves City empty');
    await profile.clearPincode();
    await profile.fillPincode('999999');
    expect(await profile.getPincodeError()).toContain('Invalid pincode');
    expect(await profile.getAutoFilledCity()).toBe('');

    // Recovery: a valid pincode must clear the error and populate the fields.
    await profile.clearPincode();
    await profile.fillPincode('160019');
    await expect.poll(() => profile.getAutoFilledCity(), { timeout: 20000 }).toBe('Chandigarh');
    await expect(page.getByText(/Invalid pincode/i)).toBeHidden();

    console.log('📍 Negative 6: Submit stays disabled while the terms box is unchecked');
    await profile.fillBasicDetails('Shahid', 'Volunteer');
    await profile.selectGender('Male');
    await profile.selectDateOfBirthDay('11');
    await profile.selectPassingYear('2026');
    await profile.selectUniversityType('Select Board/University', 'Other');
    await profile.fillBoardUniversity('CBSE Board');
    await profile.fillSchoolCollegeName('Green Valley Public School');
    expect(await profile.isAgreementChecked()).toBeFalsy();
    expect(await profile.isSubmitEnabled()).toBeFalsy();

    // ── Known product gap, asserted so the suite documents current behaviour ──
    // With the terms box ticked the Submit button enables even though required
    // fields are empty: the button is gated on the checkbox ALONE, not on form
    // validity, and blanking a required field produces no inline error either.
    // Verified against the live testing environment on 2026-08-01. Raise with the
    // dev team; if required-field validation is added, update this block.
    console.log('📍 Negative 7: [KNOWN GAP] Submit is gated only by the checkbox, not by form validity');
    await profile.toggleAgreementCheckbox();
    expect(await profile.isSubmitEnabled()).toBeTruthy();

    await profile.clearBasicDetails();
    await page.getByRole('textbox', { name: 'Last Name' }).click(); // blur to trigger any validation
    await page.waitForTimeout(1000);
    expect(await profile.getFirstName()).toBe('');
    expect(
      await profile.isSubmitEnabled(),
      'Documents the current gap: Submit remains enabled with a blank required First Name'
    ).toBeTruthy();
    console.warn(
      '   ⚠️  Submit remained ENABLED with First Name blank — no required-field validation on this form.'
    );

    // Restore a sane state; the form is never submitted.
    await profile.toggleAgreementCheckbox();
    expect(await profile.isSubmitEnabled()).toBeFalsy();
  });
});
