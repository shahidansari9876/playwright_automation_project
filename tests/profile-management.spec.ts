import { test, expect, Page } from '@playwright/test';
import { LoginPage, OtpPage, ProfilePage } from '../pages';

/**
 * Coverage for the beneficiary and volunteer "View Profile" pages: editing
 * profile details (name) and personal information (alternate phone, bio),
 * and full add/edit/delete cycles for Educational Qualifications and Work
 * Experience — both sections are shared by the two roles. Volunteer
 * Experience is volunteer-only (no equivalent section exists on the
 * beneficiary profile), so it's covered only in the volunteer describe
 * block below.
 *
 * Runs against the same long-lived, already-verified accounts used by
 * non-pu-exam-flow.spec.ts. The profile-details name edit is round-tripped
 * (changed, verified, changed back) since other specs reference these
 * accounts by name; Education/Experience entries are left in place after
 * their delete step confirms removal, consistent with how this suite
 * already leaves incidental data behind on these accounts.
 */
const TEST_OTP = '123456';
const runId = Date.now();

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

// Shared by both roles — Educational Qualifications has identical fields on
// both profile pages.
async function runEducationCrud(page: Page, profile: ProfilePage, label: string): Promise<void> {
  const institution = `QA Institute ${label}`;

  console.log('📍 Add Education');
  await profile.clickAddEducation();
  await profile.fillEducationCourse(`QA Course ${label}`);
  await profile.fillEducationInstitution(institution);
  await profile.fillEducationLocation('Chandigarh');
  await profile.selectEducationStartDate('Jan', '2020');
  await profile.checkEducationOngoing();
  await profile.fillEducationNotes('QA automated education entry');
  await profile.submitEducation();
  await expect(page.getByText('Education added successfully')).toBeVisible();
  await expect(page.getByText(institution)).toBeVisible();

  console.log('📍 Edit Education');
  await profile.clickEditEducation(institution);
  await profile.fillEducationCourse(`QA Course ${label} (Updated)`);
  await profile.submitEducation();
  await expect(page.getByText('Education updated successfully')).toBeVisible();
  await expect(page.getByText(`QA Course ${label} (Updated)`)).toBeVisible();

  console.log('📍 Delete Education');
  await profile.deleteEducation(institution);
  await expect(page.getByText(institution)).toHaveCount(0);
}

// Shared by both roles — Work Experience has identical fields on both
// profile pages.
async function runWorkExperienceCrud(page: Page, profile: ProfilePage, label: string): Promise<void> {
  const jobTitle = `QA Job ${label}`;

  console.log('📍 Add Work Experience');
  await profile.clickAddExperience();
  await profile.fillExperienceJobTitle(jobTitle);
  await profile.fillExperienceOrganisation(`QA Organisation ${label}`);
  await profile.fillExperienceLocation('Chandigarh');
  await profile.selectExperienceStartDate('Jan', '2020');
  await profile.checkExperienceOngoing();
  await profile.fillExperienceNotes('QA automated work experience entry');
  await profile.submitExperience();
  await expect(page.getByText(jobTitle)).toBeVisible();

  console.log('📍 Edit Work Experience');
  await profile.clickEditExperience(jobTitle);
  await profile.fillExperienceOrganisation(`QA Organisation ${label} (Updated)`);
  await profile.submitExperience();
  await expect(page.getByText(`QA Organisation ${label} (Updated)`)).toBeVisible();

  console.log('📍 Delete Work Experience');
  await profile.deleteExperience(jobTitle);
  await expect(page.getByText(jobTitle)).toHaveCount(0);
}

test.describe.serial('Beneficiary Profile Management', () => {
  test.setTimeout(120_000);

  let page: Page;
  let profile: ProfilePage;
  let originalFirstName: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    profile = new ProfilePage(page);
    await loginAs(page, 'shahidstq@yopmail.com');
    await profile.navigateAsBeneficiary();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Edit Profile Details: update and revert the first name', async () => {
    console.log('\n📍 Capture the current first name and update it to a temp value');
    await profile.openEditProfileDetails();
    originalFirstName = await page.getByRole('dialog').getByRole('textbox', { name: /First Name/ }).inputValue();
    await profile.fillFirstName(`QA${runId}`);
    await profile.submitProfileDetails();
    await expect(profile.getDisplayNameHeading()).toContainText(`QA${runId}`);

    console.log('📍 Revert the first name back to its original value');
    await profile.openEditProfileDetails();
    await profile.fillFirstName(originalFirstName);
    await profile.submitProfileDetails();
    await expect(profile.getDisplayNameHeading()).toContainText(originalFirstName);
  });

  test('Edit Personal Information: update alternate phone and bio', async () => {
    const newBio = `QA automated bio update ${runId}`;
    const newAltPhone = String(9000000000 + (runId % 100000000));

    await profile.openEditPersonalInformation();
    await profile.fillAlternatePhone(newAltPhone);
    await profile.fillIntroduceYourself(newBio);
    await profile.saveChanges();

    await expect(page.getByText(newAltPhone)).toBeVisible();
    await expect(page.getByText(newBio)).toBeVisible();
  });

  test('Educational Qualifications: add, edit, and delete', async () => {
    await runEducationCrud(page, profile, `Ben${runId}`);
  });

  test('Work Experience: add, edit, and delete', async () => {
    await runWorkExperienceCrud(page, profile, `Ben${runId}`);
  });
});

test.describe.serial('Volunteer Profile Management', () => {
  test.setTimeout(120_000);

  let page: Page;
  let profile: ProfilePage;
  let originalFirstName: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    profile = new ProfilePage(page);
    await loginAs(page, 'shahid@yopmail.com');
    await profile.navigateAsVolunteer();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Edit Profile Details: update and revert the first name', async () => {
    console.log('\n📍 Capture the current first name and update it to a temp value');
    await profile.openEditProfileDetails();
    originalFirstName = await page.getByRole('dialog').getByRole('textbox', { name: /First Name/ }).inputValue();
    await profile.fillFirstName(`QA${runId}`);
    await profile.submitProfileDetails();
    await expect(profile.getDisplayNameHeading()).toContainText(`QA${runId}`);

    console.log('📍 Revert the first name back to its original value');
    await profile.openEditProfileDetails();
    await profile.fillFirstName(originalFirstName);
    await profile.submitProfileDetails();
    await expect(profile.getDisplayNameHeading()).toContainText(originalFirstName);
  });

  test('Edit Personal Information: update alternate phone and bio', async () => {
    const newBio = `QA automated bio update ${runId}`;
    const newAltPhone = String(9000000000 + (runId % 100000000));

    await profile.openEditPersonalInformation();
    await profile.fillAlternatePhone(newAltPhone);
    await profile.fillIntroduceYourself(newBio);
    await profile.saveChanges();

    await expect(page.getByText(newAltPhone)).toBeVisible();
    await expect(page.getByText(newBio)).toBeVisible();
  });

  test('Educational Qualifications: add, edit, and delete', async () => {
    await runEducationCrud(page, profile, `Vol${runId}`);
  });

  test('Work Experience: add, edit, and delete', async () => {
    await runWorkExperienceCrud(page, profile, `Vol${runId}`);
  });

  test('Volunteer Experience: add, edit, and delete (volunteer-only section)', async () => {
    const title = `QA Volunteer Drive ${runId}`;

    console.log('\n📍 Add Volunteer Experience');
    await profile.clickAddVolunteerExperience();
    await profile.fillVolunteerExperienceTitle(title);
    await profile.fillVolunteerExperienceLocation('Chandigarh');
    await profile.selectVolunteerExperienceStartDate('Jan', '2024');
    await profile.checkVolunteerExperienceOngoing();
    await profile.fillVolunteerExperienceNotes('QA automated volunteer experience entry');
    await profile.submitVolunteerExperience();
    await expect(page.getByText(title)).toBeVisible();

    console.log('📍 Edit Volunteer Experience');
    await profile.clickEditVolunteerExperience(title);
    await profile.fillVolunteerExperienceTitle(`${title} (Updated)`);
    await profile.submitVolunteerExperience();
    await expect(page.getByText(`${title} (Updated)`)).toBeVisible();

    console.log('📍 Delete Volunteer Experience');
    await profile.deleteVolunteerExperience(`${title} (Updated)`);
    await expect(page.getByText(`${title} (Updated)`)).toHaveCount(0);
  });
});
