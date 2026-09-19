import path from 'path';
import { test, expect, Page } from '@playwright/test';
import {
  LoginPage,
  OtpPage,
  AdminLoginPage,
  AdminReviewPage,
  AdminCoeVerificationPage,
  ExamRequestPage,
  ExamActivityPage,
  ProfilePage,
  ProfileDocumentsPage,
  ChatPage,
} from '../pages';

/**
 * Chat gating coverage for PU semester exam requests, using a single exam
 * for both the locked and unlocked cases. Confirmed live:
 *  - Chat for a PU exam stays locked until 12 hours before the exam — the
 *    "Send message" button's own accessible name spells out the exact
 *    unlock time while locked ("Send message. Chat will be enabled 12 hours
 *    before the exam (<date>).").
 *  - The exam's admin page (Scribe Requests -> Exam Schedule -> View) has an
 *    "Enable chat immediately" switch under "PU Verification" ("Off uses the
 *    standard 12-hour window") that bypasses the gate on demand, independent
 *    of PU/CoE verification status — flipping it on a real exam still over a
 *    year away unlocked chat immediately while the exam remained "Awaiting
 *    Verification". This means one far-future exam is enough to exercise
 *    both states: locked by default, then unlocked via the toggle — no need
 *    to construct a second exam dated within the 12h window (which would
 *    otherwise require IST-timezone-aware date math and only be
 *    constructible during part of the day).
 *
 * Runs on the same long-lived, already-verified beneficiary/volunteer
 * accounts used by non-pu-chat-flow.spec.ts and pu-semester-exam-flow.spec.ts
 * (shahidstq@yopmail.com / shahid@yopmail.com), rather than signing up a
 * fresh PU account each run (as pu-semester-exam-flow.spec.ts does) — that
 * account defaults to a non-PU ("Other") institution type, so this suite
 * temporarily switches the beneficiary to PU via Edit Personal Information,
 * then switches it back to "Other" (with its original School/College and
 * Board/University values) once done, in test.afterAll, so no other spec
 * relying on this shared account is affected. If the beneficiary's
 * professional photo and the volunteer's PU documents (professional photo +
 * highest education certificate) are already verified from a prior run of
 * this file, the corresponding upload/verify steps below detect that and
 * skip themselves.
 *
 * masterOtp=true (present on every LOGIN_URL/admin LOGIN_URL used here)
 * makes '123456' the universal OTP for every account on this test env.
 */
const TEST_OTP = '123456';
const ADMIN_EMAIL = 'shahid.ansari@ledsak.ai';

const runId = Date.now();
const beneficiary = {
  email: 'shahidstq@yopmail.com',
  fullName: 'Shahid Ansari',
};
const volunteer = {
  email: 'shahid@yopmail.com',
  fullName: 'Shahid',
};

// This account's original ("Other") institution details, confirmed live
// from its profile page before this suite ever switches it to PU — restored
// in test.afterAll.
const ORIGINAL_INSTITUTION = {
  boardUniversity: 'Chandigarh',
  schoolCollege: 'Inter college',
};

const images = {
  hallPass: path.join(__dirname, '..', 'images', 'hall pass.jpg'),
  professionalPhoto: path.join(__dirname, '..', 'images', 'professional pic.jpg'),
};

const examTitle = `PU Chat Gate ${runId}`;

// A fixed far-future date/time would collide with a prior run's request on
// this long-lived, repeatedly-reused beneficiary account — the app rejects
// it as an overlap purely by date+time, regardless of subject text
// (confirmed live: two requests with different subjects but the same
// date/time both triggered "This exam overlaps with ... Choose a different
// time."). Spread it across a window of dates well beyond the 12h chat-gate
// boundary instead, so "far future" stays true and collision-free run over run.
const examDateObj = new Date(Date.now() + (400 + (runId % 300)) * 24 * 60 * 60 * 1000);
const examYear = String(examDateObj.getFullYear());
const examMonth = examDateObj.toLocaleString('en-US', { month: 'short' });
const examDay = String(examDateObj.getDate());

async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Profile picture of/ }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
  await page.waitForURL(/\/login/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

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

test.describe.serial('PU Semester Exam Chat Gate Flow', () => {
  test.setTimeout(240_000);

  let page: Page;
  let adminPage: Page;
  let examId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    adminPage = await browser.newPage();

    const adminLogin = new AdminLoginPage(adminPage);
    await adminLogin.navigate();
    await adminLogin.enterEmail(ADMIN_EMAIL);
    await adminLogin.submitEmail();
    await adminLogin.enterOtp(TEST_OTP);
    await adminLogin.verifyAndLogin();
    expect(await adminLogin.waitForDashboard()).toBeTruthy();
  });

  test.afterAll(async () => {
    try {
      console.log('\n📍 Cleanup: reverting beneficiary institution type back to "Other"');
      await logout(page);
      await loginAs(page, beneficiary.email);
      const profile = new ProfilePage(page);
      await profile.navigateAsBeneficiary();
      await profile.openEditPersonalInformation();
      await profile.selectUniversityType('Other');
      await profile.fillBoardUniversityFreeText(ORIGINAL_INSTITUTION.boardUniversity);
      await profile.fillSchoolCollegeNameFreeText(ORIGINAL_INSTITUTION.schoolCollege);
      await profile.saveChanges();
      await expect(page.getByText('Profile updated successfully')).toBeVisible();
    } catch (err) {
      console.error('⚠️ Failed to revert beneficiary institution type back to "Other" — manual cleanup needed on shahidstq@yopmail.com:', err);
    } finally {
      await page.close();
      await adminPage.close();
    }
  });

  test('Beneficiary: switch institution type to PU (temporary, reverted in afterAll)', async () => {
    console.log('\n📍 Log in as the existing beneficiary');
    await loginAs(page, beneficiary.email);

    const profile = new ProfilePage(page);
    await profile.navigateAsBeneficiary();
    await profile.openEditPersonalInformation();
    await profile.selectUniversityType('PU');
    await profile.selectStudentType('Affiliated College');
    await profile.selectSchoolCollege('D.A.V', /D\.A\.V\. Post Graduate College/i);
    await profile.fillPuEnrollmentNumber(`PU2026CHATQA${runId}`);
    await profile.saveChanges();
    await expect(page.getByText('Profile updated successfully')).toBeVisible();
  });

  test('Beneficiary: ensure a verified professional photo (required for PU semester requests)', async () => {
    const examRequest = new ExamRequestPage(page);
    await examRequest.navigate();
    await examRequest.selectSemesterExam('Yes');

    const gated = await page
      .getByText('Professional photo verification required')
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (!gated) {
      console.log('\n📍 Beneficiary already has a verified professional photo — nothing to do');
      return;
    }

    console.log('\n📍 Beneficiary needs a verified professional photo — uploading one now');
    const profile = new ProfilePage(page);
    await profile.navigateAsBeneficiary();
    await profile.clickUploadProfessionalPhoto();
    await profile.uploadProfessionalPhotoFile(images.professionalPhoto);
    await profile.submitProfessionalPhotoUpload();
    await expect(page.getByText('Professional photo uploaded successfully')).toBeVisible();

    console.log('📍 Admin verifies the beneficiary professional photo');
    const review = new AdminReviewPage(adminPage);
    await review.searchAndOpen(review.BENEFICIARIES_URL, beneficiary.email);
    await review.openTab('Identity');
    await review.openTab('Professional Photo');
    await review.verifyPhoto();
    await expect(adminPage.getByText('Verified', { exact: true }).first()).toBeVisible();
  });

  test('Beneficiary: create a far-future PU semester exam request and volunteer accepts it', async () => {
    console.log('\n📍 Fill and submit a PU semester exam request dated well over 12h out');
    const examRequest = new ExamRequestPage(page);
    await examRequest.navigate();
    await examRequest.selectSemesterExam('Yes');
    await examRequest.selectExamCategory('Regular');
    await examRequest.selectSemesterNumber('Semester 3');
    await examRequest.fillExamTitle(examTitle);
    await examRequest.fillMedium('English');
    await examRequest.uploadHallPass(images.hallPass);
    await examRequest.uploadDateSheet(images.hallPass);
    await examRequest.selectExamCenter('Panjab');
    await examRequest.fillExamCenterCity('Chandigarh');
    await examRequest.fillExamCenterPincode('160014');
    await examRequest.fillExamCenterAddress('Sector 14, Panjab University Campus, Chandigarh');
    await examRequest.fillSubjectName(`PU Chat Gate Subject ${runId}`);
    await examRequest.selectExamDate(examYear, examMonth, examDay);
    await examRequest.selectStartTime('9', '00', 'AM');
    await examRequest.selectEndTime('12', '00', 'PM');
    await examRequest.fillNotes('QA test PU semester exam - chat gate case (locked by default, then admin-unlocked).');
    await examRequest.submit();
    await page.waitForURL('**/beneficiary', { timeout: 20000 });

    await page.getByRole('link', { name: 'View Details' }).first().click();
    await page.waitForURL(/\/beneficiary\/exam\/\d+/, { timeout: 15000 });
    examId = new URL(page.url()).pathname.split('/').pop()!;
    console.log(`📍 Created exam ID: ${examId}`);
    expect(examId).toMatch(/^\d+$/);

    console.log('📍 Log in as the existing volunteer and accept (handling the PU documents gate if shown)');
    await logout(page);
    await loginAs(page, volunteer.email);

    const activity = new ExamActivityPage(page);
    await activity.navigateAsVolunteer(examId);
    await activity.clickAcceptRequest();

    if (await activity.isPuRequirementsDialogShown()) {
      console.log('📍 Volunteer needs verified PU documents — uploading professional photo + education document');
      const docs = new ProfileDocumentsPage(page);
      await docs.clickUploadRequiredDocuments();
      await docs.uploadFile(images.professionalPhoto);
      await docs.saveAndContinuePu();
      await expect(page.getByRole('heading', { name: 'Upload Your Highest Education Document' })).toBeVisible();
      await docs.uploadFile(images.professionalPhoto); // no dedicated "highest education certificate" asset available
      await docs.saveAndFinishPu();

      console.log('📍 Admin verifies the volunteer professional photo');
      const review = new AdminReviewPage(adminPage);
      await review.searchAndOpen(review.VOLUNTEERS_URL, volunteer.email);
      await review.openTab('Identity');
      await review.openTab('Professional Photo');
      await review.verifyPhoto();
      await expect(adminPage.getByText('Verified', { exact: true }).first()).toBeVisible();

      console.log('📍 Retry acceptance now that PU requirements are satisfied');
      await page.reload({ waitUntil: 'networkidle' });
      await activity.clickAcceptRequest();
    }

    expect(await activity.isPuRequirementsDialogShown()).toBeFalsy();
    await activity.confirmAcceptance();
    await expect(page.getByText('Awaiting PU Verification')).toBeVisible();
  });

  test('Chat: locked more than 12 hours before a PU semester exam', async () => {
    const activity = new ExamActivityPage(page);

    console.log('\n📍 Chat stays locked on the volunteer side while the exam is over a year away');
    await activity.navigateAsVolunteer(examId);
    await expect(page.getByRole('button', { name: /^Send message/ })).toBeDisabled();

    console.log('📍 Chat stays locked on the beneficiary side too');
    await logout(page);
    await loginAs(page, beneficiary.email);
    await activity.navigateAsBeneficiary(examId);
    await expect(page.getByRole('button', { name: /^Send message/ })).toBeDisabled();
  });

  test('Chat: admin can unlock it immediately, independent of PU verification status', async () => {
    console.log('\n📍 Admin enables chat immediately for this exam (bypassing the 12h gate)');
    const coe = new AdminCoeVerificationPage(adminPage);
    await coe.openExamFromScribeRequest(examTitle, beneficiary.fullName);
    await coe.setChatImmediatelyEnabled(true);

    const activity = new ExamActivityPage(page);
    const chat = new ChatPage(page);

    console.log('📍 Chat is now enabled on the volunteer side, despite PU/CoE verification still being pending');
    await logout(page);
    await loginAs(page, volunteer.email);
    await activity.navigateAsVolunteer(examId);
    await expect(page.getByRole('button', { name: /^Send message/ })).toBeEnabled();
    await activity.clickChatButton();
    const conversationId = chat.getConversationIdFromUrl();
    const volunteerMessage = 'Chat gate test - volunteer message, chat force-enabled by admin.';
    await chat.sendMessage(volunteerMessage);

    console.log('📍 Beneficiary sees the message, and chat is enabled there too');
    await logout(page);
    await loginAs(page, beneficiary.email);
    await activity.navigateAsBeneficiary(examId);
    await expect(page.getByRole('button', { name: /^Send message/ })).toBeEnabled();
    await activity.clickChatButton();
    await expect(chat.messageLocator(volunteerMessage)).toBeVisible();
    const beneficiaryMessage = 'Chat gate test - beneficiary reply, confirming chat works both ways.';
    await chat.sendMessage(beneficiaryMessage);

    console.log('📍 Volunteer sees the beneficiary reply');
    await logout(page);
    await loginAs(page, volunteer.email);
    await chat.navigateAsVolunteer(conversationId);
    await expect(chat.messageLocator(beneficiaryMessage)).toBeVisible();

    console.log('📍 Admin disables the override again, restoring the standard 12h gate for this exam');
    await coe.setChatImmediatelyEnabled(false);
  });
});
