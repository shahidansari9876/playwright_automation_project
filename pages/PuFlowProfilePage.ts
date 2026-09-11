import { Page } from '@playwright/test';

/**
 * Profile-setup form used by the puflow.md end-to-end spec.
 *
 * Deliberately self-contained rather than extending the shared
 * SetupProfilePage.ts — that file is exercised directly by
 * beneficiary-profile-fields.spec.ts and setup-profile.spec.ts, so it stays
 * untouched here to avoid any risk of affecting those tests.
 */
export class PuFlowProfilePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForRoleSelection(): Promise<boolean> {
    const roleSection = this.page.getByText(/Choose your role/i).first();
    return await roleSection.waitFor({ state: 'visible', timeout: 30000 }).then(() => true).catch(() => false);
  }

  async waitForProfileSetupPage(): Promise<boolean> {
    const heading = this.page.locator('text=/setup profile|complete your profile|your profile|profile details/i').first();
    return await heading.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
  }

  async chooseBeneficiaryRole(): Promise<void> {
    await this.page.getByRole('radio', { name: /I am a Beneficiary/i }).click();
  }

  async clickRegisterAsBeneficiary(): Promise<void> {
    await this.page.getByRole('button', { name: /Register as a Beneficiary/i }).click();
  }

  async chooseVolunteerRole(): Promise<void> {
    await this.page.getByRole('radio', { name: /I am a Volunteer/i }).click();
  }

  async clickRegisterAsVolunteer(): Promise<void> {
    await this.page.getByRole('button', { name: /Register as a Volunteer/i }).click();
  }

  async fillBasicDetails(firstName: string, lastName: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'First Name *' }).fill(firstName);
    await this.page.getByRole('textbox', { name: 'Last Name' }).fill(lastName);
  }

  async selectGender(value: string): Promise<void> {
    await this.page.getByRole('combobox', { name: 'Gender' }).click();
    await this.page.getByRole('option', { name: value, exact: true }).click();
  }

  async selectDateOfBirthYear(year: string): Promise<void> {
    await this.page.getByLabel('Date of Birth Year').selectOption([year]);
  }

  async selectDateOfBirthMonth(month: string): Promise<void> {
    await this.page.getByLabel('Date of Birth Month').selectOption([month]);
  }

  async selectDateOfBirthDay(day: string): Promise<void> {
    await this.page.getByLabel('Date of Birth Day').selectOption([day]);
  }

  // Field label changed live (confirmed 2026-09-11) from "Highest Education" to
  // "Highest Completed or Current Qualification" — the old label no longer exists
  // anywhere on the form, so this click used to hang until its action timeout.
  async selectHighestEducation(optionText: string | RegExp): Promise<void> {
    await this.page.getByRole('combobox', { name: 'Highest Completed or Current Qualification' }).click();
    await this.page.getByRole('option', { name: optionText }).click();
  }

  async selectDegreeType(optionText: string): Promise<void> {
    await this.page.getByRole('combobox').filter({ hasText: 'Select degree type' }).click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
  }

  // Confirmed live (2026-09-11): Education Status is no longer a combobox — it's a
  // two-option radiogroup ("Completed" / "Currently Pursuing"), each its own
  // labelled radio. `currentText` is retained for call-site compatibility only.
  async selectEducationStatus(currentText: string, optionText: string): Promise<void> {
    void currentText;
    await this.page.getByRole('radio', { name: optionText, exact: true }).click();
  }

  async selectYearOfStudy(optionText: string): Promise<void> {
    await this.page.getByRole('combobox').filter({ hasText: 'Select year' }).click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
  }

  // Renamed live (confirmed 2026-09-11) from "Passing Year" to "Completion Year"
  // (status = Completed) / "Expected Completion Year" (status = Currently
  // Pursuing) — both contain "Completion Year", so an unanchored name match covers
  // whichever of the two is currently rendered.
  async selectPassingYear(year: string): Promise<void> {
    await this.page.getByRole('combobox', { name: /Completion Year/ }).click();
    await this.page.getByRole('option', { name: year, exact: true }).click();
  }

  async selectUniversityType(currentText: string, optionText: string): Promise<void> {
    await this.page.getByRole('combobox').filter({ hasText: currentText }).click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
  }

  async fillBoardUniversityFreeText(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Enter Board/University' }).fill(value);
  }

  async fillSchoolCollegeNameFreeText(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'School/College Name *' }).fill(value);
  }

  async selectStudentType(optionText: string): Promise<void> {
    await this.page.getByRole('combobox', { name: 'Student Type *' }).click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
  }

  async selectSchoolCollege(optionTextPattern: string | RegExp): Promise<void> {
    await this.page.getByRole('button', { name: 'Show school suggestions' }).click();
    await this.page.getByRole('option', { name: optionTextPattern }).first().click();
  }

  async fillPuEnrollmentNumber(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'PU Enrollment Number / Roll Number *' }).fill(value);
  }

  async fillPincode(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Enter Pincode' }).fill(value);
  }

  async getAutoFilledCity(): Promise<string> {
    return this.page.getByRole('textbox', { name: 'City *' }).inputValue();
  }

  async fillFullAddress(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Full Address (Optional)' }).fill(value);
  }

  async toggleAgreementCheckbox(): Promise<void> {
    await this.page.getByRole('checkbox', { name: /I agree to the Terms and/i }).click();
  }

  async isSubmitEnabled(): Promise<boolean> {
    return this.page.getByRole('button', { name: 'Submit' }).isEnabled();
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }
}
