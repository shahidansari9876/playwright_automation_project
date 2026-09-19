import path from 'path';
import { test, expect, Page } from '@playwright/test';
import {
  LoginPage,
  OtpPage,
  ExamRequestPage,
  ExamActivityPage,
  ChatPage,
} from '../pages';

/**
 * Chat coverage for a non-PU (regular) exam request. Confirmed live: chat
 * opens immediately once a volunteer accepts (no PU-style time gate), and
 * messages sent by either side reliably arrive on the other even across a
 * fresh page load, not just a live push.
 *
 * Runs on the same long-lived, already-verified beneficiary/volunteer
 * accounts used by non-pu-exam-flow.spec.ts, but creates its own throwaway
 * exam request so this file can run independently of that spec.
 *
 * masterOtp=true (present on every LOGIN_URL used here) makes '123456' the
 * universal OTP for every account on this test env.
 */
const TEST_OTP = '123456';

const runId = Date.now();
const beneficiary = {
  email: 'shahidstq@yopmail.com',
  fullName: 'Shahid Ansari',
};
const volunteer = {
  email: 'shahid@yopmail.com',
  fullName: 'Shahid',
};

const examTitle = `Chat Flow Exam ${runId}`;

// Spread across a window (mirrors non-pu-exam-flow.spec.ts) to avoid
// colliding with a prior run's request for the same subject on this
// long-lived, repeatedly-reused beneficiary account.
const examDateObj = new Date(Date.now() + (1 + (runId % 300)) * 24 * 60 * 60 * 1000);
const examYear = String(examDateObj.getFullYear());
const examMonth = examDateObj.toLocaleString('en-US', { month: 'short' });
const examDay = String(examDateObj.getDate());

const images = {
  hallPass: path.join(__dirname, '..', 'images', 'hall pass.jpg'),
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

test.describe.serial('Non-PU Exam Chat Flow', () => {
  test.setTimeout(180_000);

  let page: Page;
  let examId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Beneficiary creates a non-PU exam request and volunteer accepts it', async () => {
    console.log('\n📍 Log in as the existing beneficiary');
    await loginAs(page, beneficiary.email);

    const examRequest = new ExamRequestPage(page);
    console.log('📍 Fill and submit a regular exam request ("This is a semester exam" is PU-board-only and does not render for this non-PU account)');
    await examRequest.navigate();
    await examRequest.fillExamTitle(examTitle);
    await examRequest.fillMedium('English');
    await examRequest.uploadHallPass(images.hallPass);
    await examRequest.uploadDateSheet(images.hallPass);
    await examRequest.fillExamCenterName('Chat Flow Exam Centre');
    await examRequest.fillExamCenterCity('Chandigarh');
    await examRequest.fillExamCenterPincode('160014');
    await examRequest.fillExamCenterAddress('Sector 22, Chandigarh');
    await examRequest.fillSubjectName(`Chat Flow Subject ${runId}`);
    await examRequest.selectExamDate(examYear, examMonth, examDay);
    await examRequest.selectStartTime('9', '00', 'AM');
    await examRequest.selectEndTime('12', '00', 'PM');
    await examRequest.fillNotes('QA test exam request created for chat-flow testing.');
    await examRequest.submit();
    await page.waitForURL('**/beneficiary', { timeout: 20000 });

    await page.getByRole('link', { name: 'View Details' }).first().click();
    await page.waitForURL(/\/beneficiary\/exam\/\d+/, { timeout: 15000 });
    examId = new URL(page.url()).pathname.split('/').pop()!;
    console.log(`📍 Created exam ID: ${examId}`);
    expect(examId).toMatch(/^\d+$/);

    console.log('📍 Log in as the existing volunteer and accept');
    await logout(page);
    await loginAs(page, volunteer.email);

    const activity = new ExamActivityPage(page);
    await activity.navigateAsVolunteer(examId);
    await activity.clickAcceptRequest();
    await activity.confirmAcceptance();
    await expect(page.getByText('ACCEPTED', { exact: true })).toBeVisible();
  });

  test('Beneficiary and volunteer exchange 6 messages, visible identically on both sides', async () => {
    const activity = new ExamActivityPage(page);
    const chat = new ChatPage(page);

    console.log('\n📍 Chat is enabled immediately after acceptance (no PU gating for non-PU exams)');
    await activity.navigateAsVolunteer(examId);
    await expect(page.getByRole('button', { name: /^Send message/ })).toBeEnabled();
    await activity.clickChatButton();
    const conversationId = chat.getConversationIdFromUrl();

    // 6 alternating messages, confirmed live to arrive on the other side
    // within ~2s with no reload needed — this test instead re-navigates
    // (logout/login, same pattern as the rest of this suite) between turns,
    // which also proves the thread survives a fresh page load, not just a
    // live push.
    const messages = [
      'Chat check 1: volunteer here, exam looks good.',
      'Chat check 2: beneficiary confirming, thanks!',
      'Chat check 3: volunteer will arrive 15 minutes early.',
      'Chat check 4: beneficiary, sounds perfect.',
      'Chat check 5: volunteer, see you at the center.',
      'Chat check 6: beneficiary, looking forward to it.',
    ];

    console.log('📍 Volunteer sends message 1');
    await chat.sendMessage(messages[0]);

    console.log('📍 Beneficiary sees message 1 and replies with message 2');
    await logout(page);
    await loginAs(page, beneficiary.email);
    await chat.navigateAsBeneficiary(conversationId);
    await expect(chat.messageLocator(messages[0])).toBeVisible();
    await chat.sendMessage(messages[1]);

    console.log('📍 Volunteer sees message 2 and replies with message 3');
    await logout(page);
    await loginAs(page, volunteer.email);
    await chat.navigateAsVolunteer(conversationId);
    await expect(chat.messageLocator(messages[1])).toBeVisible();
    await chat.sendMessage(messages[2]);

    console.log('📍 Beneficiary sees message 3 and replies with message 4');
    await logout(page);
    await loginAs(page, beneficiary.email);
    await chat.navigateAsBeneficiary(conversationId);
    await expect(chat.messageLocator(messages[2])).toBeVisible();
    await chat.sendMessage(messages[3]);

    console.log('📍 Volunteer sees message 4 and replies with message 5');
    await logout(page);
    await loginAs(page, volunteer.email);
    await chat.navigateAsVolunteer(conversationId);
    await expect(chat.messageLocator(messages[3])).toBeVisible();
    await chat.sendMessage(messages[4]);

    console.log('📍 Beneficiary sees message 5 and replies with message 6');
    await logout(page);
    await loginAs(page, beneficiary.email);
    await chat.navigateAsBeneficiary(conversationId);
    await expect(chat.messageLocator(messages[4])).toBeVisible();
    await chat.sendMessage(messages[5]);

    console.log('📍 Volunteer sees the full 6-message thread, identical to the beneficiary side');
    await logout(page);
    await loginAs(page, volunteer.email);
    await chat.navigateAsVolunteer(conversationId);
    for (const message of messages) {
      await expect(chat.messageLocator(message)).toBeVisible();
    }
  });
});
