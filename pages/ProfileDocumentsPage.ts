import { Page } from '@playwright/test';

/**
 * Covers every "upload a document into a step wizard" dialog in the app:
 * beneficiary Complete Profile (identity -> disability -> photo), volunteer
 * Complete Profile (identity only), and the PU-specific Professional
 * Photo -> Education Document wizard shown when a volunteer accepts a PU
 * semester exam. All of them share the same Save-and-continue/Save-and-finish
 * shape, so one class drives all three instead of one per wizard.
 *
 * File inputs here are visually hidden (sr-only) behind custom "Choose file"
 * buttons. locator.setInputFiles() works on them directly without needing to
 * click first or handle a native file-chooser dialog.
 */
export class ProfileDocumentsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private dialog() {
    return this.page.getByRole('dialog');
  }

  private fileInput(index = 0) {
    return this.dialog().locator('input[type="file"]').nth(index);
  }

  async uploadFile(filePath: string, index = 0): Promise<void> {
    await this.fileInput(index).setInputFiles(filePath);
  }

  // --- Beneficiary Complete Profile wizard ---

  async selectIdentityDocumentType(type: string): Promise<void> {
    await this.page.getByLabel('Identity document type').selectOption(type);
  }

  async saveAndContinue(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Save and continue' }).click();
  }

  async selectDisabilityStatus(status: string): Promise<void> {
    await this.page.getByLabel('Disability status').selectOption(status);
  }

  async selectDisabilityType(type: string): Promise<void> {
    await this.page.getByLabel('Type of disability').selectOption(type);
  }

  async saveAndFinish(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Save and finish' }).click();
  }

  // --- Volunteer Complete Profile wizard (single identity step) ---

  async selectVolunteerDocumentType(type: string): Promise<void> {
    await this.dialog().getByRole('combobox', { name: 'Document Type' }).click();
    await this.page.getByRole('option', { name: type }).click();
  }

  async saveAndFinishVolunteer(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Save & Finish' }).click();
  }

  async clickReviewDocuments(): Promise<void> {
    await this.page.getByRole('button', { name: 'Review Documents' }).click();
  }

  async clickResubmitIdentity(): Promise<void> {
    // "Replace file" doubles as both the label text and the click target for
    // the underlying hidden input; no dialog re-open button is needed here.
    await this.page.getByText('Replace file').click();
  }

  // --- PU Requirements wizard (Professional Photo -> Education Document) ---

  async clickUploadRequiredDocuments(): Promise<void> {
    await this.page.getByRole('button', { name: 'Upload Required Documents' }).click();
  }

  async saveAndContinuePu(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Save & Continue' }).click();
  }

  async saveAndFinishPu(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Save & Finish' }).click();
  }

  async closeDialog(): Promise<void> {
    await this.dialog().getByRole('button', { name: 'Close' }).click();
  }
}
