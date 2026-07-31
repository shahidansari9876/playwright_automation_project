import { Page } from '@playwright/test';

/**
 * The exam detail page (/beneficiary/exam/:id and /volunteer/exam/:id) drives
 * everything after a scribe request is created: volunteer acceptance, PU
 * resubmission, exam completion (both sides), and payout requests. Both
 * roles land on effectively the same layout, so one class covers both.
 */
export class ExamActivityPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateAsBeneficiary(examId: string | number): Promise<void> {
    await this.page.goto(`https://testing.thescribebank.com/beneficiary/exam/${examId}`, { waitUntil: 'networkidle' });
  }

  async navigateAsVolunteer(examId: string | number): Promise<void> {
    await this.page.goto(`https://testing.thescribebank.com/volunteer/exam/${examId}`, { waitUntil: 'networkidle' });
  }

  // --- Volunteer: accept the scribe request ---

  async clickAcceptRequest(): Promise<void> {
    await this.page.getByRole('button', { name: 'Accept Request' }).first().click();
  }

  // Returns true if the "Complete PU Requirements" gate blocked acceptance
  // (professional photo / highest education doc still missing or unverified).
  async isPuRequirementsDialogShown(): Promise<boolean> {
    return this.page
      .getByRole('heading', { name: 'Complete PU Requirements' })
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
  }

  async confirmAcceptance(): Promise<void> {
    const dialog = this.page.getByRole('dialog').filter({ hasText: 'Accepting Request' });
    const checkboxes = dialog.getByRole('checkbox');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }
    await dialog.getByRole('button', { name: 'Confirm' }).click();
  }

  // --- Volunteer: resubmit after a COE/PU rejection ---

  async clickResubmitPuVerification(): Promise<void> {
    await this.page.getByRole('button', { name: 'Resubmit PU verification' }).click();
    await this.page.getByRole('dialog').getByRole('button', { name: 'Resubmit' }).click();
  }

  async getRejectionReasonText(): Promise<string | null> {
    return this.page.getByText(/^Reason:/).textContent();
  }

  // --- Volunteer: exam completion request ---

  async clickCreateCompletionRequest(): Promise<void> {
    await this.page.getByRole('button', { name: 'Request completion from beneficiary' }).click();
  }

  async uploadCompletionProof(filePath: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Add File' }).click();
    // Add File opens a native file chooser rather than exposing a bare
    // input[type=file] up front, so setFiles via the chooser event is needed
    // here (unlike the other sr-only inputs in this project).
    const [chooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
    ]);
    await chooser.setFiles(filePath);
  }

  async rateCompletionExperience(hearts: 1 | 2 | 3 | 4 | 5): Promise<void> {
    await this.page.getByRole('button', { name: `Rate ${hearts} heart${hearts > 1 ? 's' : ''}` }).click();
  }

  async fillCompletionNote(note: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Add a short note' }).fill(note);
  }

  async confirmCompletionSubmission(): Promise<void> {
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('checkbox', { name: /I confirm that I completed/ }).check();
    await dialog.getByRole('checkbox', { name: /I agree that the uploaded photograph/ }).check();
    await dialog.getByRole('button', { name: 'Submit' }).click();
  }

  // --- Beneficiary: review the completion request ---

  async clickMarkAsCompleted(): Promise<void> {
    await this.page.getByRole('button', { name: 'Mark As Completed' }).click();
  }

  async clickRejectCompletion(): Promise<void> {
    await this.page.getByRole('button', { name: 'Reject' }).click();
  }

  async rateVolunteer(hearts: 1 | 2 | 3 | 4 | 5): Promise<void> {
    await this.page.getByRole('button', { name: `Rate ${hearts} heart${hearts > 1 ? 's' : ''}` }).click();
  }

  async fillVolunteerRatingComment(comment: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Enter Here' }).fill(comment);
  }

  async confirmMarkAsCompleted(): Promise<void> {
    await this.page.getByRole('dialog').getByRole('button', { name: 'Mark As Completed' }).click();
  }

  // --- Volunteer: payout request ---

  async clickCreatePayoutRequest(): Promise<void> {
    await this.page.getByRole('button', { name: 'Create Payout Request' }).click();
  }

  async isNoBankAccountPromptShown(): Promise<boolean> {
    return this.page.getByText('No Account Added').isVisible().catch(() => false);
  }

  async clickAddAnAccount(): Promise<void> {
    // Redirects to /volunteer/profile/payment-methods, outside this dialog.
    await this.page.getByRole('button', { name: 'Add an account' }).click();
  }

  async selectPayoutAccount(bankNameSubstring: string): Promise<void> {
    await this.page.getByRole('button', { name: new RegExp(bankNameSubstring) }).click();
  }

  async confirmPayoutRequest(): Promise<void> {
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('checkbox', { name: /I confirm that I completed this request/ }).check();
    await dialog.getByRole('button', { name: 'Submit' }).click();
  }

  async getExamStatusText(): Promise<string | null> {
    return this.page.locator('text=/^(NEW|ACCEPTED|Accepted|COMPLETED|COMPLETION REQUESTED|PU Rejected|PU Verified)$/').first().textContent().catch(() => null);
  }
}
