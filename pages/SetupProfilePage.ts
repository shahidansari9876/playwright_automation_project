import { Locator, Page } from '@playwright/test';

export class SetupProfilePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForRoleSelection(): Promise<boolean> {
    // Must actually wait: right after OTP submit the page sits on a disabled
    // "Logging in..." button for a moment before redirecting, so a same-tick
    // isVisible() check (with no polling) reads false and fails immediately.
    // getByText (regex) is more reliable here than a hand-built, comma-joined
    // 'text=' selector-engine string, which did not reliably match even when
    // "Choose your role" was confirmed present and visible in the DOM.
    const roleSection = this.page.getByText(/Choose your role/i).first();
    return await roleSection.waitFor({ state: 'visible', timeout: 30000 }).then(() => true).catch(() => false);
  }

  async chooseBeneficiaryRole(): Promise<boolean> {
    const beneficiarySelectors = [
      'button:has-text("Beneficiary")',
      'label:has-text("Beneficiary")',
      'input[value="beneficiary"]',
      'input[name*="role"][value*="beneficiary"]',
      'input[type="radio"][value*="beneficiary"]',
      'text=I am a Beneficiary',
      'text=Beneficiary, seeking help and support from volunteers.'
    ];

    for (const selector of beneficiarySelectors) {
      const locator = this.page.locator(selector).first();
      if (await locator.count() > 0 && await locator.isVisible().catch(() => false)) {
        await locator.click().catch(() => {});
        return true;
      }
    }

    const cardLocator = this.page.locator('div:has-text("I am a Beneficiary"), section:has-text("Beneficiary")').first();
    if (await cardLocator.count() > 0 && await cardLocator.isVisible().catch(() => false)) {
      await cardLocator.click().catch(() => {});
      return true;
    }
    return false;
  }

  async waitForProfileSetupPage(): Promise<boolean> {
    const heading = this.page.locator('text=/setup profile|complete your profile|your profile|profile details/i').first();
    return await heading.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
  }

  async getTextFields(): Promise<Locator[]> {
    return [
      this.page.locator('input[type="text"]'),
      this.page.locator('input[type="email"]'),
      this.page.locator('input[type="tel"]'),
      this.page.locator('input[placeholder*="name" i]'),
      this.page.locator('input[placeholder*="address" i]')
    ].flatMap(locator => [locator]).filter(Boolean) as Locator[];
  }

  async getDateFields(): Promise<Locator[]> {
    return [this.page.locator('input[type="date"]'), this.page.locator('input[placeholder*="dob" i]')].flatMap(locator => [locator]) as Locator[];
  }

  async getSelectFields(): Promise<Locator[]> {
    return [this.page.locator('select'), this.page.locator('[role="combobox"]')].flatMap(locator => [locator]) as Locator[];
  }

  async getCheckboxes(): Promise<Locator[]> {
    return [this.page.locator('input[type="checkbox"]')].flatMap(locator => [locator]) as Locator[];
  }

  async getRadioButtons(): Promise<Locator[]> {
    return [this.page.locator('input[type="radio"]')].flatMap(locator => [locator]) as Locator[];
  }

  async getTextAreas(): Promise<Locator[]> {
    return [this.page.locator('textarea')].flatMap(locator => [locator]) as Locator[];
  }

  async getFileInputs(): Promise<Locator[]> {
    return [this.page.locator('input[type="file"]')].flatMap(locator => [locator]) as Locator[];
  }

  private async getVisibleLocators(locators: Locator[]): Promise<Locator[]> {
    const visible: Locator[] = [];
    for (const locator of locators) {
      const count = await locator.count();
      for (let i = 0; i < count; i++) {
        const item = locator.nth(i);
        if (await item.isVisible().catch(() => false)) {
          visible.push(item);
        }
      }
    }
    return visible;
  }

  async interactWithProfileComponents(): Promise<{ textFields: number; dateFields: number; selectFields: number; checkboxes: number; radioButtons: number; textAreas: number; fileInputs: number; }> {
    const textFields = await this.getVisibleLocators(await this.getTextFields());
    const dateFields = await this.getVisibleLocators(await this.getDateFields());
    const selectFields = await this.getVisibleLocators(await this.getSelectFields());
    const checkboxes = await this.getVisibleLocators(await this.getCheckboxes());
    const radioButtons = await this.getVisibleLocators(await this.getRadioButtons());
    const textAreas = await this.getVisibleLocators(await this.getTextAreas());
    const fileInputs = await this.getVisibleLocators(await this.getFileInputs());

    for (const field of textFields) {
      await field.fill('Test Entry').catch(() => {});
    }

    for (const dateField of dateFields) {
      await dateField.fill('1990-01-01').catch(() => {});
    }

    for (const selectField of selectFields) {
      const options = await selectField.locator('option').all();
      if (options.length > 1) {
        await selectField.selectOption({ index: 1 }).catch(() => {});
      }
    }

    for (const checkbox of checkboxes) {
      const isChecked = await checkbox.isChecked().catch(() => false);
      if (!isChecked) {
        await checkbox.check().catch(() => {});
      }
    }

    for (const radio of radioButtons) {
      const isChecked = await radio.isChecked().catch(() => false);
      if (!isChecked) {
        await radio.check().catch(() => {});
        break;
      }
    }

    for (const area of textAreas) {
      await area.fill('Profile details test').catch(() => {});
    }

    return {
      textFields: textFields.length,
      dateFields: dateFields.length,
      selectFields: selectFields.length,
      checkboxes: checkboxes.length,
      radioButtons: radioButtons.length,
      textAreas: textAreas.length,
      fileInputs: fileInputs.length
    };
  }

  async verifySubmitButtonNotClicked(): Promise<boolean> {
    const submitButton = this.page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("Continue")').first();
    return await submitButton.count() > 0 && await submitButton.isVisible().catch(() => false);
  }

  // ───────────────────────────────────────────────────────────────────────
  // Field-level helpers for the Beneficiary "Setup Your Profile" form.
  // Unlike the generic interactWithProfileComponents() above, these target
  // specific fields by role/label so conditional UI behaviour (fields that
  // appear/disappear based on other selections) can be asserted step by step.
  // ───────────────────────────────────────────────────────────────────────

  async clickRegisterAsBeneficiary(): Promise<void> {
    await this.page.getByRole('button', { name: /Register as a Beneficiary/i }).click();
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

  async isDateOfBirthDayEnabled(): Promise<boolean> {
    return this.page.getByLabel('Date of Birth Day').isEnabled();
  }

  // Polls for a locator to reach the given state instead of taking one instant
  // isVisible() snapshot — conditional fields on this form mount/unmount a beat
  // after the triggering selection, so a same-tick check is a race that flakes.
  private async waitForState(locator: Locator, state: 'visible' | 'hidden', timeout = 4000): Promise<boolean> {
    return locator.waitFor({ state, timeout }).then(() => true).catch(() => false);
  }

  // --- Highest Education (drives Degree Type vs Parent/Guardian fields) ---

  async selectHighestEducation(optionText: string | RegExp): Promise<void> {
    await this.page.getByRole('combobox', { name: 'Highest Education' }).click();
    await this.page.getByRole('option', { name: optionText }).click();
  }

  async isDegreeTypeFieldVisible(): Promise<boolean> {
    // Scoped to <label>: a plain text/substring locator for "Degree Type" also
    // case-insensitively matches the sibling combobox's "Select degree type"
    // placeholder span, which trips a strict-mode violation (silently caught
    // as false by waitForState). Scoping to the label element is unambiguous.
    return this.waitForState(this.page.locator('label').filter({ hasText: 'Degree Type' }), 'visible');
  }

  async isParentGuardianFieldsVisible(): Promise<boolean> {
    return this.waitForState(this.page.getByRole('textbox', { name: 'Parent/Guardian Name *' }), 'visible');
  }

  async selectDegreeType(optionText: string): Promise<void> {
    await this.page.getByRole('combobox').filter({ hasText: 'Select degree type' }).click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
  }

  // --- Education Status (drives the "Year of Study" field) ---

  async selectEducationStatus(currentText: string, optionText: string): Promise<void> {
    await this.page.getByRole('combobox').filter({ hasText: currentText }).click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
  }

  async isYearOfStudyFieldVisible(): Promise<boolean> {
    // Same label-scoping reasoning as isDegreeTypeFieldVisible above.
    return this.waitForState(this.page.locator('label').filter({ hasText: 'Year of Study' }), 'visible');
  }

  async selectPassingYear(year: string): Promise<void> {
    await this.page.getByRole('combobox', { name: 'Passing Year' }).click();
    await this.page.getByRole('option', { name: year, exact: true }).click();
  }

  // --- University Type (PU vs Other drives Student Type / free-text board) ---

  async selectUniversityType(currentText: string, optionText: string): Promise<void> {
    await this.page.getByRole('combobox').filter({ hasText: currentText }).click();
    await this.page.getByRole('option', { name: optionText, exact: true }).click();
  }

  async isBoardUniversityFreeTextVisible(): Promise<boolean> {
    return this.waitForState(this.page.getByRole('textbox', { name: 'Enter Board/University' }), 'visible');
  }

  async isStudentTypeFieldVisible(): Promise<boolean> {
    return this.waitForState(this.page.getByRole('combobox', { name: 'Student Type *' }), 'visible');
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

  // --- Current Address (pincode drives City/State auto-fill) ---

  async fillPincode(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Enter Pincode' }).fill(value);
  }

  async getAutoFilledCity(): Promise<string> {
    return this.page.getByRole('textbox', { name: 'City *' }).inputValue();
  }

  async getAutoFilledState(): Promise<string> {
    return (await this.page.getByRole('combobox', { name: 'State' }).textContent())?.trim() ?? '';
  }

  async fillFullAddress(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Full Address (Optional)' }).fill(value);
  }

  // --- Terms & Conditions checkbox (gates the Submit button) ---

  async toggleAgreementCheckbox(): Promise<void> {
    await this.page.getByRole('checkbox', { name: /I agree to the Terms and/i }).click();
  }

  async isAgreementChecked(): Promise<boolean> {
    return this.page.getByRole('checkbox', { name: /I agree to the Terms and/i }).isChecked();
  }

  async isSubmitEnabled(): Promise<boolean> {
    return this.page.getByRole('button', { name: 'Submit' }).isEnabled();
  }
}
