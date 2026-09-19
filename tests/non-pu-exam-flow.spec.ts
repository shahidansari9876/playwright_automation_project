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
  PaymentMethodsPage,
  AdminPayoutsPage,
  VolunteerPayoutsPage,
} from '../pages';

/**
 * End-to-end coverage of nonPUflow.md: a non-PU (regular) exam request,
 * created and processed on the same long-lived beneficiary/volunteer test
 * accounts used across repeated runs (unlike pu-semester-exam-flow.spec.ts,
 * which signs up a fresh throwaway account each run). Both accounts are
 * already verified, so there's no sign-up/profile-setup/document-review
 * phase here — the flow starts directly at request creation.
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

// Unique per run so the admin Scribe Requests search (which matches exam
// name as well as beneficiary name/email) narrows to exactly this request —
// searching by beneficiary.email alone would match every one of this
// account's many prior scribe requests too.
const examTitle = `General Aptitude Exam ${runId}`;

// A fixed date/time would collide with a prior run's request for the same
// subject on this long-lived, repeatedly-reused beneficiary account (the
// app rejects it: "This exam overlaps with General Studies on ... Choose a
// different time."), so spread it across a ~300-day window instead.
const examDateObj = new Date(Date.now() + (1 + (runId % 300)) * 24 * 60 * 60 * 1000);
const examYear = String(examDateObj.getFullYear());
const examMonth = examDateObj.toLocaleString('en-US', { month: 'short' });
const examDay = String(examDateObj.getDate());

const images = {
  hallPass: path.join(__dirname, '..', 'images', 'hall pass.jpg'),
  scribePerforma: path.join(__dirname, '..', 'images', 'selfie with the scribe performa.jpg'),
};

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

test.describe.serial('Non-PU (Regular) Exam End-to-End Flow (nonPUflow.md)', () => {
  test.setTimeout(180_000);

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
    await page.close();
    await adminPage.close();
  });

  test('Beneficiary: create a regular (non-PU) exam request', async () => {
    console.log('\n📍 Log in as the existing beneficiary');
    await loginAs(page, beneficiary.email);

    const examRequest = new ExamRequestPage(page);
    console.log('📍 Fill and submit a regular exam request ("This is a semester exam" is PU-board-only and does not render for this non-PU account)');
    await examRequest.navigate();
    await examRequest.fillExamTitle(examTitle);
    await examRequest.fillMedium('English');
    await examRequest.uploadHallPass(images.hallPass);
    await examRequest.uploadDateSheet(images.hallPass);
    await examRequest.fillExamCenterName('Government Model High School Exam Centre');
    await examRequest.fillExamCenterCity('Chandigarh');
    await examRequest.fillExamCenterPincode('160014');
    await examRequest.fillExamCenterAddress('Sector 22, Government Model High School, Chandigarh');
    await examRequest.fillSubjectName('General Studies');
    await examRequest.selectExamDate(examYear, examMonth, examDay);
    await examRequest.selectStartTime('9', '00', 'AM');
    await examRequest.selectEndTime('12', '00', 'PM');
    await examRequest.fillNotes('QA test non-PU exam request created via automated flow.');
    await examRequest.submit();
    await page.waitForURL('**/beneficiary', { timeout: 20000 });

    await page.getByRole('link', { name: 'View Details' }).first().click();
    await page.waitForURL(/\/beneficiary\/exam\/\d+/, { timeout: 15000 });
    examId = new URL(page.url()).pathname.split('/').pop()!;
    console.log(`📍 Created exam ID: ${examId}`);
    expect(examId).toMatch(/^\d+$/);
  });

  test('Admin: verify the request is not a PU Semester flow', async () => {
    const coe = new AdminCoeVerificationPage(adminPage);

    console.log('\n📍 Admin opens the scribe request and checks the PU Semester Flow tag');
    await coe.openScribeRequest(examTitle, beneficiary.fullName);
    expect(await coe.isNormalFlow()).toBeTruthy();
  });

  test('Volunteer: accept the request directly (no PU requirements gate)', async () => {
    console.log('\n📍 Log in as the existing volunteer');
    await logout(page);
    await loginAs(page, volunteer.email);

    const activity = new ExamActivityPage(page);
    await activity.navigateAsVolunteer(examId);
    await activity.clickAcceptRequest();
    await activity.confirmAcceptance();
    await expect(page.getByText('ACCEPTED', { exact: true })).toBeVisible();
  });

  test('Admin: force-end the exam for testing', async () => {
    const coe = new AdminCoeVerificationPage(adminPage);

    console.log('\n📍 Admin locates the exam via Exam Schedule and force-ends it for testing');
    await coe.openExamFromScribeRequest(examTitle, beneficiary.fullName);
    await coe.setEndedForTesting();
  });

  test('Exam completion and volunteer payout', async () => {
    const activity = new ExamActivityPage(page);

    console.log('\n📍 Volunteer creates the completion request');
    await activity.navigateAsVolunteer(examId);
    await activity.clickCreateCompletionRequest();
    await activity.uploadCompletionProof(images.scribePerforma);
    await activity.rateCompletionExperience(5);
    await activity.fillCompletionNote('Exam completed smoothly. Beneficiary was well prepared.');
    await activity.confirmCompletionSubmission();
    await expect(page.getByText('COMPLETION REQUESTED')).toBeVisible();

    console.log('📍 Beneficiary marks the request as completed');
    await logout(page);
    await loginAs(page, beneficiary.email);
    await activity.navigateAsBeneficiary(examId);
    await activity.clickMarkAsCompleted();
    await activity.rateVolunteer(5);
    await activity.fillVolunteerRatingComment('Great scribe, very professional and helpful.');
    await activity.confirmMarkAsCompleted();
    await expect(page.getByText('COMPLETED', { exact: true })).toBeVisible();

    console.log('📍 Volunteer requests payout');
    await logout(page);
    await loginAs(page, volunteer.email);
    await activity.navigateAsVolunteer(examId);
    await activity.clickCreatePayoutRequest();

    if (await activity.isNoBankAccountPromptShown()) {
      console.log('📍 No bank account on file — adding one');
      await activity.clickAddAnAccount();

      const paymentMethods = new PaymentMethodsPage(page);
      await paymentMethods.clickAddPaymentMethod();
      await paymentMethods.fillAccountHolderName(volunteer.fullName);
      await paymentMethods.fillBankName('State Bank of India');
      await paymentMethods.fillAccountNumber('123456789012');
      await paymentMethods.fillConfirmAccountNumber('123456789012');
      await paymentMethods.fillIfscCode('SBIN0001234');
      await paymentMethods.fillConfirmIfscCode('SBIN0001234');
      await paymentMethods.fillBranch('Sector 17 Chandigarh Branch');
      await paymentMethods.fillDisplayName('My Primary Bank Account');
      await paymentMethods.checkMarkAsDefault();
      await paymentMethods.submit();
      await expect(page.getByText('PENDING VERIFICATION')).toBeVisible();

      console.log('📍 Admin approves the newly added bank account');
      const review = new AdminReviewPage(adminPage);
      await review.searchAndOpen(review.VOLUNTEERS_URL, volunteer.email);
      await review.openTab('Payment');
      await review.approveBankAccount();
      await expect(adminPage.getByText('Verified', { exact: true }).first()).toBeVisible();

      await activity.navigateAsVolunteer(examId);
      await activity.clickCreatePayoutRequest();
      await activity.selectPayoutAccount('State Bank of India');
    } else if (await activity.isPendingVerificationShown()) {
      console.log('📍 Bank account on file but not yet approved — admin approves it first');
      const review = new AdminReviewPage(adminPage);
      await review.searchAndOpen(review.VOLUNTEERS_URL, volunteer.email);
      await review.openTab('Payment');
      await review.approveBankAccount();
      await expect(adminPage.getByText('Verified', { exact: true }).first()).toBeVisible();

      await activity.navigateAsVolunteer(examId);
      await activity.clickCreatePayoutRequest();
      await activity.selectPayoutAccount('Sbin');
    } else {
      console.log('📍 Bank account already verified — selecting the default account');
      await activity.selectPayoutAccount('Sbin');
    }

    await activity.confirmPayoutRequest();
    await expect(page.getByRole('button', { name: 'View Payout Request' })).toBeVisible();
  });

  test('Admin: mark the payout Completed, and volunteer confirms it', async () => {
    console.log('\n📍 Admin opens the payout for this exam and confirms it is Requested');
    const payouts = new AdminPayoutsPage(adminPage);
    const internalExamId = await payouts.openPayoutForExam(examTitle);
    expect(await payouts.getCurrentStatus()).toBe('REQUESTED');

    console.log('📍 Admin marks it Completed with a transaction ID and updates the payment');
    await payouts.selectPaymentStatus('Completed');
    await payouts.selectPaymentMethod('Bank Transfer');
    await payouts.fillTransactionId(`TXN-QA-${runId}`);
    await payouts.ensureNotificationsChecked();
    await payouts.updatePayment();

    console.log('📍 Volunteer checks the same exam in their Payouts tab and confirms it is Completed');
    const volunteerPayouts = new VolunteerPayoutsPage(page);
    await volunteerPayouts.navigate();
    await volunteerPayouts.searchByExamId(internalExamId);
    expect(await volunteerPayouts.isStatusShown('COMPLETED')).toBeTruthy();
  });
});
