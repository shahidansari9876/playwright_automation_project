import path from 'path';
import { test, expect, Page } from '@playwright/test';
import {
  LoginPage,
  OtpPage,
  RegistrationPage,
  PuFlowProfilePage,
  ProfileDocumentsPage,
  AdminLoginPage,
  AdminReviewPage,
  AdminCoeVerificationPage,
  ExamRequestPage,
  ExamActivityPage,
  PaymentMethodsPage,
} from '../pages';

/**
 * End-to-end coverage of puflow.md: beneficiary creates a PU Semester Exam
 * request, a volunteer accepts and completes it (including a document
 * rejection/resubmit detour on both the volunteer identity check and the
 * COE/PU verification), and the volunteer gets paid out.
 *
 * Runs as one continuous session across two pages sharing the same browser:
 * `page` for the public site (beneficiary and volunteer share this origin,
 * so switching roles means logging out and back in — same as a real user
 * would), and `adminPage` for the separate admin-panel origin, logged in
 * once and reused throughout.
 *
 * masterOtp=true (present on every LOGIN_URL/SIGNUP_URL/admin LOGIN_URL used
 * here) makes '123456' the universal OTP for every account on this test env.
 */
const TEST_OTP = '123456';
const ADMIN_EMAIL = 'shahid.ansari@ledsak.ai'; // NOTE: puflow.md has this misspelled as "asnari" — that email 404s with "Account not found."

const runId = Date.now();
const beneficiary = {
  email: `benef${runId}@yopmail.com`,
  phone: `9${String(runId).slice(-9)}`,
  firstName: 'Priya',
  lastName: 'Sharma',
  fullName: 'Priya Sharma',
};
const volunteer = {
  email: `volun${runId}@yopmail.com`,
  phone: `8${String(runId).slice(-9)}`,
  firstName: 'Rohan',
  lastName: 'Verma',
  fullName: 'Rohan Verma',
};

const images = {
  identity: path.join(__dirname, '..', 'images', 'idnentity imae.jpg'),
  disability: path.join(__dirname, '..', 'images', 'disability certificate.png'),
  professionalPhoto: path.join(__dirname, '..', 'images', 'professional pic.jpg'),
  hallPass: path.join(__dirname, '..', 'images', 'hall pass.jpg'),
  scribePerforma: path.join(__dirname, '..', 'images', 'selfie with the scribe performa.jpg'),
};

async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Profile picture of/ }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
  // Logout redirects client-side to /login; a goto() fired immediately after
  // the click can race that in-flight redirect and get aborted
  // (net::ERR_ABORTED). waitForLoadState('networkidle') alone isn't enough —
  // the redirect itself can land after the network settles — so wait for the
  // actual destination URL before navigating away.
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
  // OTP verification redirects client-side once the session is established;
  // a goto() fired immediately after (every caller navigates right away) can
  // race that in-flight redirect and land back on /login unauthenticated —
  // mirrors the logout() race above, just in the opposite direction.
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

test.describe.serial('PU Semester Exam End-to-End Flow (puflow.md)', () => {
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

  test('Beneficiary: sign up, verify OTP, complete profile (PU institution flow)', async () => {
    const registration = new RegistrationPage(page);
    const setupProfile = new PuFlowProfilePage(page);

    console.log('\n📍 Beneficiary sign-up + OTP');
    await registration.navigate();
    await registration.enterEmail(beneficiary.email);
    await registration.enterPhone(beneficiary.phone);
    await registration.submitSignUp();
    expect(await registration.isOtpFieldVisible()).toBeTruthy();
    await registration.enterOtp(TEST_OTP);
    await registration.verifyAndCreateAccount();

    console.log('📍 Role selection: Beneficiary');
    expect(await setupProfile.waitForRoleSelection()).toBeTruthy();
    await setupProfile.chooseBeneficiaryRole();
    await setupProfile.clickRegisterAsBeneficiary();
    expect(await setupProfile.waitForProfileSetupPage()).toBeTruthy();

    console.log('📍 Basic details + education (PU, Bachelor 2nd Year)');
    await setupProfile.fillBasicDetails(beneficiary.firstName, beneficiary.lastName);
    await setupProfile.selectGender('Female');
    await setupProfile.selectDateOfBirthYear('2005');
    await setupProfile.selectDateOfBirthMonth('Jun');
    await setupProfile.selectDateOfBirthDay('10');
    await setupProfile.selectHighestEducation(/Bachelor.?s Degree/i);
    await setupProfile.selectDegreeType('4-Year');
    await setupProfile.selectEducationStatus('Completed', 'Currently Pursuing');
    await setupProfile.selectYearOfStudy('2nd Year');
    await setupProfile.selectPassingYear('2027');

    console.log('📍 Institution details (PU -> Affiliated College)');
    await setupProfile.selectUniversityType('Select Board/University', 'PU');
    await setupProfile.selectStudentType('Affiliated College');
    await setupProfile.selectSchoolCollege(/D\.A\.V\. Post Graduate College/i);
    await setupProfile.fillPuEnrollmentNumber('PU2027SB78901');

    console.log('📍 Address (pincode auto-fill) + submit');
    await setupProfile.fillPincode('160019');
    await expect.poll(() => setupProfile.getAutoFilledCity(), { timeout: 15000 }).toBe('Chandigarh');
    await setupProfile.fillFullAddress('House No. 45, Sector 19, Chandigarh');
    await setupProfile.toggleAgreementCheckbox();
    expect(await setupProfile.isSubmitEnabled()).toBeTruthy();
    await setupProfile.submit();
    // Brand-new account registration (not just login) writes profile + role
    // data server-side before redirecting — this can take noticeably longer
    // than the 15s default under real network conditions, so give it room.
    await page.waitForURL('**/beneficiary', { timeout: 30000 });

    console.log('📍 Complete profile: identity, disability, professional photo');
    const docs = new ProfileDocumentsPage(page);
    await page.getByRole('button', { name: 'Complete profile' }).click();
    await docs.selectIdentityDocumentType('Aadhar Card');
    await docs.uploadFile(images.identity);
    await docs.saveAndContinue();
    await docs.selectDisabilityDocumentType('Disability Certificate');
    await docs.selectDisabilityStatus('Permanently disabled');
    await docs.selectDisabilityType('Visually Impaired');
    await docs.uploadFile(images.disability);
    await docs.saveAndContinue();
    await expect(page.getByRole('heading', { name: 'Add a professional photo' })).toBeVisible();
    await docs.uploadFile(images.professionalPhoto);
    await docs.saveAndFinish();

    await expect(page.getByText('50% complete')).toBeVisible();
  });

  test('Admin: verify all three beneficiary documents', async () => {
    const review = new AdminReviewPage(adminPage);

    console.log('\n📍 Admin approves identity, professional photo, disability certificate');
    await review.searchAndOpen(review.BENEFICIARIES_URL, beneficiary.email);
    await review.openTab('Identity');
    await review.approveIdentityDocument();
    await expect(adminPage.getByText('Verified', { exact: true }).first()).toBeVisible();

    await review.openTab('Professional Photo');
    await review.verifyPhoto();

    await review.openTab('Disability');
    await review.approveDisabilityCertificate();
  });

  test('Volunteer: sign up, verify OTP, complete profile (Other institution flow)', async () => {
    const registration = new RegistrationPage(page);
    const setupProfile = new PuFlowProfilePage(page);

    console.log('\n📍 Volunteer sign-up + OTP (logging out beneficiary first)');
    await logout(page);
    await registration.navigate();
    await registration.enterEmail(volunteer.email);
    await registration.enterPhone(volunteer.phone);
    await registration.submitSignUp();
    expect(await registration.isOtpFieldVisible()).toBeTruthy();
    await registration.enterOtp(TEST_OTP);
    await registration.verifyAndCreateAccount();

    console.log('📍 Role selection: Volunteer');
    expect(await setupProfile.waitForRoleSelection()).toBeTruthy();
    await setupProfile.chooseVolunteerRole();
    await setupProfile.clickRegisterAsVolunteer();
    expect(await setupProfile.waitForProfileSetupPage()).toBeTruthy();

    console.log('📍 Basic details + education (12th Standard)');
    await setupProfile.fillBasicDetails(volunteer.firstName, volunteer.lastName);
    await setupProfile.selectGender('Male');
    await setupProfile.selectDateOfBirthYear('2003');
    await setupProfile.selectDateOfBirthMonth('Mar');
    await setupProfile.selectDateOfBirthDay('20');
    await setupProfile.selectHighestEducation('12th Standard (HSC/Intermediate)');
    await setupProfile.selectPassingYear('2021');

    console.log('📍 Institution details (Other -> free text board/school)');
    await setupProfile.selectUniversityType('Select Board/University', 'Other');
    await setupProfile.fillBoardUniversityFreeText('CBSE');
    await setupProfile.fillSchoolCollegeNameFreeText('Delhi Public School, Sector 45');

    console.log('📍 Address + submit');
    await setupProfile.fillPincode('160019');
    await expect.poll(() => setupProfile.getAutoFilledCity(), { timeout: 15000 }).toBe('Chandigarh');
    await setupProfile.fillFullAddress('House No. 12, Sector 45, Chandigarh');
    await setupProfile.toggleAgreementCheckbox();
    await setupProfile.submit();
    await page.waitForURL('**/volunteer', { timeout: 30000 });

    console.log('📍 Complete profile: identity document (single step)');
    const docs = new ProfileDocumentsPage(page);
    await docs.selectVolunteerDocumentType('Aadhar Card');
    await docs.uploadFile(images.identity);
    await docs.saveAndFinishVolunteer();

    await expect(page.getByText('In Review', { exact: true })).toBeVisible();
  });

  test('Admin -> Volunteer: identity document rejection and resubmission demo', async () => {
    const review = new AdminReviewPage(adminPage);
    const rejectionReason = 'Document is not clear or readable';

    console.log('\n📍 Admin rejects the volunteer identity document');
    await review.searchAndOpen(review.VOLUNTEERS_URL, volunteer.email);
    await review.openTab('Identity');
    await review.rejectIdentityDocument(rejectionReason);
    await expect(adminPage.getByText('Rejected', { exact: true }).first()).toBeVisible();

    console.log('📍 Volunteer sees the rejection reason and re-uploads');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText(rejectionReason)).toBeVisible();
    const docs = new ProfileDocumentsPage(page);
    await docs.clickReviewDocuments();
    await docs.clickResubmitIdentity();
    await docs.uploadFile(images.identity);
    await docs.saveAndFinishVolunteer();
    await expect(page.getByText('In Review', { exact: true })).toBeVisible();

    console.log('📍 Admin approves the re-uploaded document');
    await adminPage.reload({ waitUntil: 'networkidle' });
    await expect(adminPage.getByText('Re-Uploaded')).toBeVisible();
    await review.approveIdentityDocument();
  });

  test('Beneficiary: create PU Semester Exam request', async () => {
    console.log('\n📍 Log back in as beneficiary');
    await logout(page);
    await loginAs(page, beneficiary.email);

    const examRequest = new ExamRequestPage(page);
    console.log('📍 Fill and submit the PU semester exam request');
    await examRequest.navigate();
    await examRequest.checkSemesterExam();
    await examRequest.selectExamCategory('Regular');
    await examRequest.selectSemesterNumber('Semester 3');
    await examRequest.fillExamTitle('B.A. Semester 3 Examination');
    await examRequest.fillMedium('English');
    await examRequest.uploadHallPass(images.hallPass);
    await examRequest.uploadDateSheet(images.hallPass);
    await examRequest.selectExamCenter('Panjab');
    await examRequest.fillExamCenterCity('Chandigarh');
    await examRequest.fillExamCenterPincode('160014');
    await examRequest.fillExamCenterAddress('Sector 14, Panjab University Campus, Chandigarh');
    await examRequest.fillSubjectName('Political Science');
    await examRequest.selectExamDate('2026', 'Dec', '15');
    await examRequest.selectStartTime('9', '00', 'AM');
    await examRequest.selectEndTime('12', '00', 'PM');
    await examRequest.fillNotes('QA test PU semester exam request created via automated flow.');
    await examRequest.submit();
    await page.waitForURL('**/beneficiary', { timeout: 20000 });

    await page.getByRole('link', { name: 'View Details' }).first().click();
    // click() only waits for the element to be actionable, not for the SPA's
    // resulting client-side route change to land — reading page.url() right
    // away can race it and still read the pre-click /beneficiary URL.
    await page.waitForURL(/\/beneficiary\/exam\/\d+/, { timeout: 15000 });
    examId = new URL(page.url()).pathname.split('/').pop()!;
    console.log(`📍 Created exam ID: ${examId}`);
    expect(examId).toMatch(/^\d+$/);
  });

  test('Volunteer: accept the PU Semester Exam request (professional photo + education doc gate)', async () => {
    console.log('\n📍 Log back in as volunteer');
    await logout(page);
    await loginAs(page, volunteer.email);

    const activity = new ExamActivityPage(page);
    await activity.navigateAsVolunteer(examId);

    console.log('📍 First accept attempt is blocked by the PU requirements gate');
    await activity.clickAcceptRequest();
    expect(await activity.isPuRequirementsDialogShown()).toBeTruthy();

    const docs = new ProfileDocumentsPage(page);
    await docs.clickUploadRequiredDocuments();
    await docs.uploadFile(images.professionalPhoto);
    await docs.saveAndContinuePu();
    // saveAndContinuePu() only waits for the click; the next step's dialog
    // content (and its own file input) mounts a beat later, so uploading
    // immediately can race the transition and silently miss (mirrors the
    // beneficiary disability->photo fix above).
    await expect(page.getByRole('heading', { name: 'Upload Your Highest Education Document' })).toBeVisible();
    await docs.uploadFile(images.professionalPhoto); // no dedicated "highest education certificate" asset provided; reused per user instruction to proceed with available files
    await docs.saveAndFinishPu();

    console.log('📍 Admin verifies the professional photo');
    const review = new AdminReviewPage(adminPage);
    await review.searchAndOpen(review.VOLUNTEERS_URL, volunteer.email);
    await review.openTab('Identity');
    await review.openTab('Professional Photo');
    await review.verifyPhoto();

    console.log('📍 Second accept attempt succeeds');
    await page.reload({ waitUntil: 'networkidle' });
    await activity.clickAcceptRequest();
    await activity.confirmAcceptance();
    await expect(page.getByText('Awaiting PU Verification')).toBeVisible();
  });

  test('Admin: COE verification rejection, resubmission, and re-verification', async () => {
    const coe = new AdminCoeVerificationPage(adminPage);
    const rejectionReason = 'Highest education document uploaded is unclear and needs to be resubmitted for verification.';

    console.log('\n📍 Admin rejects the COE verification (Reject & Hold, targeting Volunteer)');
    await coe.openExamFromScribeRequest(beneficiary.email, beneficiary.fullName);
    await coe.openPuVerificationTab();
    await coe.rejectVerification(rejectionReason, 'Volunteer', 'Reject & Hold');
    await expect(adminPage.getByText('Rejected & On Hold')).toBeVisible();

    console.log('📍 Rejection reason is shown on both the volunteer and beneficiary sides');
    const activity = new ExamActivityPage(page);
    await activity.navigateAsVolunteer(examId);
    await expect(page.getByText(rejectionReason)).toBeVisible();

    await logout(page);
    await loginAs(page, beneficiary.email);
    await activity.navigateAsBeneficiary(examId);
    await expect(page.getByText(rejectionReason)).toBeVisible();

    console.log('📍 Volunteer resubmits for PU review');
    await logout(page);
    await loginAs(page, volunteer.email);
    await activity.navigateAsVolunteer(examId);
    await activity.clickResubmitPuVerification();
    await expect(page.getByText('Awaiting PU Verification')).toBeVisible();

    console.log('📍 Admin re-reviews and fully verifies');
    await adminPage.reload({ waitUntil: 'networkidle' });
    await expect(adminPage.getByText('Resubmitted • Awaiting Verification')).toBeVisible();
    await coe.checkAllVerificationItems();
    await coe.approveAndVerify();
    await expect(adminPage.getByText('Accepted & Verified')).toBeVisible();

    console.log('📍 PU Verification Permission Letter is downloadable on both sides');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByRole('link', { name: 'Download Permission Letter' })).toBeVisible();
  });

  test('Exam completion and volunteer payout', async () => {
    console.log('\n📍 Admin force-ends the exam for testing (real exam date is in the future)');
    await adminPage.getByRole('button', { name: 'Set Ended (QA)' }).click();
    await adminPage.getByRole('button', { name: 'Confirm Override' }).click();

    const activity = new ExamActivityPage(page);

    console.log('📍 Volunteer creates the completion request');
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

    console.log('📍 Volunteer adds a bank account and requests payout');
    await logout(page);
    await loginAs(page, volunteer.email);
    await activity.navigateAsVolunteer(examId);
    await activity.clickCreatePayoutRequest();
    expect(await activity.isNoBankAccountPromptShown()).toBeTruthy();
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

    console.log('📍 Admin approves the bank account');
    const review = new AdminReviewPage(adminPage);
    await review.searchAndOpen(review.VOLUNTEERS_URL, volunteer.email);
    await review.openTab('Payment');
    await review.approveBankAccount();
    await expect(adminPage.getByText('Verified', { exact: true }).first()).toBeVisible();

    console.log('📍 Volunteer submits the payout request');
    await activity.navigateAsVolunteer(examId);
    await activity.clickCreatePayoutRequest();
    await activity.selectPayoutAccount('State Bank of India');
    await activity.confirmPayoutRequest();
    await expect(page.getByRole('button', { name: 'View Payout Request' })).toBeVisible();
  });
});
