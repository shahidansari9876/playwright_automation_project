import { expect, Locator, Page } from '@playwright/test';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
    await this.selectFromCombobox('Gender', value);
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
  //
  // Only a *timeout* is allowed to mean "not in that state". The previous version
  // caught every error, so a strict-mode violation or a bad selector came back as
  // a plain `false` and surfaced as a bogus "the field isn't there" assertion
  // failure with no clue as to the real cause. Anything that is not a timeout is
  // a broken locator and must be thrown.
  private async waitForState(locator: Locator, state: 'visible' | 'hidden', timeout = 10000): Promise<boolean> {
    try {
      await locator.waitFor({ state, timeout });
      return true;
    } catch (error) {
      const err = error as Error;
      if (err.name === 'TimeoutError' || /Timeout .* exceeded/i.test(err.message)) {
        return false;
      }
      throw err;
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // Robust combobox handling.
  //
  // Every custom combobox on this form is a `button[role="combobox"]` paired with
  // a visually-hidden native <select> that holds the real value. Only two of them
  // carry an aria-label (Gender, Highest Education, Passing Year, State); the rest
  // — University Type in particular — have nothing but a React-generated id, which
  // is why the original helpers located them with `.filter({ hasText: <current
  // value> })`. That is fragile: it targets a control by whatever it happens to
  // display, so as soon as two comboboxes show the same text (e.g. "Other" is both
  // a Highest Education value and a University Type value) the wrong control gets
  // clicked. Locating by the field's own <label> is stable regardless of value.
  // ───────────────────────────────────────────────────────────────────────

  /**
   * A dropdown option, restricted to the custom widgets.
   *
   * `getByRole('option')` on its own also matches the native <option> elements of
   * the three Date of Birth <select>s, whose year list collides with real values
   * elsewhere on the form ("2027" is both a Passing Year option and a DOB year).
   * Intersecting with an explicit [role="option"] attribute — which only the
   * custom widgets carry — keeps those out of every option query.
   */
  private optionLocator(name?: string | RegExp, exact = true): Locator {
    const custom = this.page.locator('[role="option"]');
    if (name === undefined) return custom;
    return this.page.getByRole('option', { name, exact: typeof name === 'string' ? exact : undefined }).and(custom);
  }

  /** The combobox button belonging to the field with the given label. */
  comboboxByLabel(label: string | RegExp): Locator {
    return this.page
      .locator('div')
      .filter({ has: this.page.locator('label').filter({ hasText: label }) })
      .filter({ has: this.page.locator('button[role="combobox"]') })
      .last()
      .locator('button[role="combobox"]')
      .last();
  }

  /**
   * Pick an option and then confirm the trigger actually took the value.
   *
   * This is the fix for the intermittent "Degree Type is not found" failure. The
   * listbox is portalled and animates in; a click dispatched while it is still
   * settling is silently dropped, the combobox keeps its previous value, and the
   * dependent field therefore never renders. The visible symptom was the *next*
   * step timing out inside waitForState() — i.e. an error pointing at the wait
   * helper, when the real failure was this click. Asserting the trigger text and
   * retrying the whole open-and-click as one unit removes the race.
   */
  async selectFromCombobox(label: string | RegExp, option: string | RegExp, exact = true): Promise<void> {
    const combobox = this.comboboxByLabel(label);
    const expected = typeof option === 'string' ? new RegExp(escapeRegExp(option)) : option;

    await expect(async () => {
      // Close anything already open first: the trigger toggles, so a retry that
      // began with the listbox still up would simply shut it again and then fail
      // to find the option, oscillating instead of recovering.
      if (await this.optionLocator().first().isVisible().catch(() => false)) {
        await this.page.keyboard.press('Escape');
        await this.optionLocator().first().waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
      }

      await combobox.click();
      await this.optionLocator(option, exact).click({ timeout: 5000 });
      await expect(combobox).toHaveText(expected, { timeout: 3000 });
    }).toPass({ timeout: 25000 });
  }

  /** Text currently shown on a combobox trigger (its placeholder when unset). */
  async getComboboxText(label: string | RegExp): Promise<string> {
    return (await this.comboboxByLabel(label).textContent())?.trim() ?? '';
  }

  /** Option labels available in a combobox, read by opening then closing it. */
  async getComboboxOptions(label: string | RegExp): Promise<string[]> {
    const combobox = this.comboboxByLabel(label);
    // Fail fast and say which field is missing. Without this the click below just
    // blocks until the whole test times out, and the report blames the click
    // rather than the absent field.
    if (!(await this.waitForState(combobox, 'visible', 10000))) {
      throw new Error(`No combobox found for field labelled "${label}" — the field is not rendered.`);
    }

    await combobox.click();
    await this.optionLocator().first().waitFor({ state: 'visible', timeout: 10000 });
    const options = await this.optionLocator().allTextContents();
    await this.page.keyboard.press('Escape');
    await combobox.waitFor({ state: 'visible' });
    return options.map(option => option.trim());
  }

  /** Every field label currently rendered — the cheapest way to assert which
   *  conditional blocks a given selection reveals or hides. */
  async getVisibleFieldLabels(): Promise<string[]> {
    return this.page.evaluate(() =>
      Array.from(document.querySelectorAll('label'))
        .filter(label => (label as HTMLElement).offsetParent !== null)
        .map(label => label.textContent!.trim().replace(/\s+/g, ' '))
    );
  }

  /** Is a field with this label currently rendered? */
  async isFieldVisible(label: string | RegExp): Promise<boolean> {
    return this.waitForState(this.page.locator('label').filter({ hasText: label }).first(), 'visible', 5000);
  }

  /** Is a field with this label gone? Short timeout — absence needs no polling headroom. */
  async isFieldHidden(label: string | RegExp): Promise<boolean> {
    return this.waitForState(this.page.locator('label').filter({ hasText: label }).first(), 'hidden', 5000);
  }

  // --- Highest Education (drives Degree Type vs Parent/Guardian fields) ---

  async selectHighestEducation(optionText: string | RegExp): Promise<void> {
    await this.selectFromCombobox('Highest Education', optionText);
  }

  async isDegreeTypeFieldVisible(): Promise<boolean> {
    // Scoped to <label>: a plain text/substring locator for "Degree Type" also
    // case-insensitively matches the sibling combobox's "Select degree type"
    // placeholder span, which trips a strict-mode violation (silently caught
    // as false by waitForState). Scoping to the label element is unambiguous.
    return this.isFieldVisible('Degree Type');
  }

  async isParentGuardianFieldsVisible(): Promise<boolean> {
    return this.waitForState(this.page.getByRole('textbox', { name: 'Parent/Guardian Name *' }), 'visible', 5000);
  }

  async selectDegreeType(optionText: string): Promise<void> {
    await this.selectFromCombobox('Degree Type', optionText);
  }

  // --- Education Status (drives the "Year of Study" field) ---

  // `currentText` is retained for call-site compatibility but is no longer used to
  // find the control — the field is located by its own label instead. See the note
  // on selectFromCombobox for why targeting a combobox by its displayed value was
  // unsafe.
  async selectEducationStatus(currentText: string, optionText: string): Promise<void> {
    void currentText;
    await this.selectFromCombobox('Education Status', optionText);
  }

  async isYearOfStudyFieldVisible(): Promise<boolean> {
    // Same label-scoping reasoning as isDegreeTypeFieldVisible above.
    return this.isFieldVisible('Year of Study');
  }

  async selectYearOfStudy(optionText: string): Promise<void> {
    await this.selectFromCombobox('Year of Study', optionText);
  }

  async selectPassingYear(year: string): Promise<void> {
    await this.selectFromCombobox('Passing Year', year);
  }

  // --- University Type (PU vs Other drives Student Type / free-text board) ---

  // `currentText` retained for call-site compatibility only — see selectEducationStatus.
  // This combobox is the one that made the old approach unsafe: it has no aria-label,
  // and its "Other" value is also a Highest Education value, so filtering comboboxes
  // by hasText:"Other" could match either control depending on form state.
  async selectUniversityType(currentText: string, optionText: string): Promise<void> {
    void currentText;
    await this.selectFromCombobox('University Type', optionText);
  }

  async isBoardUniversityFreeTextVisible(): Promise<boolean> {
    return this.waitForState(this.page.getByRole('textbox', { name: 'Enter Board/University' }), 'visible', 5000);
  }

  async isStudentTypeFieldVisible(): Promise<boolean> {
    return this.waitForState(this.page.getByRole('combobox', { name: 'Student Type *' }), 'visible', 5000);
  }

  async selectStudentType(optionText: string): Promise<void> {
    await this.selectFromCombobox('Student Type', optionText);
  }

  /**
   * Pick a PU college from the type-ahead.
   *
   * The search box keeps whatever was typed/selected before — including across a
   * University Type round trip, where Student Type resets but this field does not
   * — and the suggestion list is filtered by that text. Clearing first means the
   * caller always searches the full list rather than a silently narrowed one.
   */
  async selectSchoolCollege(optionTextPattern: string | RegExp, searchTerm?: string): Promise<void> {
    // Typing re-queries the college API and opens the list on its own.
    if (searchTerm !== undefined) {
      await this.page.getByPlaceholder('Search Panjab University college').fill(searchTerm);
    }

    // The toggle renames itself — it is "Show school suggestions" only while the
    // list is closed and "Hide school suggestions" once it is open. Clicking it
    // unconditionally (or waiting for the "Show" name when the list already
    // opened itself) either closes the list or blocks until the test times out.
    if (!(await this.optionLocator().first().isVisible().catch(() => false))) {
      const show = this.page.getByRole('button', { name: 'Show school suggestions' });
      if (await this.waitForState(show, 'visible', 10000)) {
        await show.click();
      }
    }

    const match = this.optionLocator(optionTextPattern).first();
    if (!(await this.waitForState(match, 'visible', 20000))) {
      const available = await this.optionLocator().allTextContents();
      throw new Error(
        `No school suggestion matched ${optionTextPattern}. ` +
          `${available.length} suggestion(s) offered: ${JSON.stringify(available.slice(0, 5))}`
      );
    }
    await match.click();
  }

  async fillPuEnrollmentNumber(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'PU Enrollment Number / Roll Number *' }).fill(value);
  }

  async getPuEnrollmentNumber(): Promise<string> {
    return this.page.getByRole('textbox', { name: 'PU Enrollment Number / Roll Number *' }).inputValue();
  }

  // --- University Type = "Other" branch (free-text board + school/college) ---

  async fillBoardUniversity(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Enter Board/University' }).fill(value);
  }

  async getBoardUniversity(): Promise<string> {
    return this.page.getByRole('textbox', { name: 'Enter Board/University' }).inputValue();
  }

  async fillSchoolCollegeName(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'School/College Name *' }).fill(value);
  }

  async getSchoolCollegeName(): Promise<string> {
    return this.page.getByRole('textbox', { name: 'School/College Name *' }).inputValue();
  }

  /** PU branch renders the school field as an autocomplete instead of a free-text box. */
  async isSchoolSuggestionsButtonVisible(): Promise<boolean> {
    return this.waitForState(this.page.getByRole('button', { name: 'Show school suggestions' }), 'visible', 5000);
  }

  async getPuSchoolSearchValue(): Promise<string> {
    return this.page.getByPlaceholder('Search Panjab University college').inputValue();
  }

  // --- Current Address (pincode drives City/State auto-fill) ---

  async fillPincode(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Enter Pincode' }).fill(value);
  }

  async clearPincode(): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Enter Pincode' }).fill('');
  }

  async getPincode(): Promise<string> {
    return this.page.getByRole('textbox', { name: 'Enter Pincode' }).inputValue();
  }

  /** Inline message the form shows when a pincode cannot be resolved. */
  async getPincodeError(timeout = 15000): Promise<string> {
    const error = this.page.getByText(/Invalid pincode/i).first();
    const appeared = await this.waitForState(error, 'visible', timeout);
    return appeared ? ((await error.textContent())?.trim() ?? '') : '';
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

  async getFullAddress(): Promise<string> {
    return this.page.getByRole('textbox', { name: 'Full Address (Optional)' }).inputValue();
  }

  // --- Basic details read-back / clearing (for fill -> clear -> refill checks) ---

  async getFirstName(): Promise<string> {
    return this.page.getByRole('textbox', { name: 'First Name *' }).inputValue();
  }

  async getLastName(): Promise<string> {
    return this.page.getByRole('textbox', { name: 'Last Name' }).inputValue();
  }

  async clearBasicDetails(): Promise<void> {
    await this.page.getByRole('textbox', { name: 'First Name *' }).fill('');
    await this.page.getByRole('textbox', { name: 'Last Name' }).fill('');
  }

  async getDateOfBirth(): Promise<{ year: string; month: string; day: string }> {
    return {
      year: await this.page.getByLabel('Date of Birth Year').inputValue(),
      month: await this.page.getByLabel('Date of Birth Month').inputValue(),
      day: await this.page.getByLabel('Date of Birth Day').inputValue(),
    };
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
