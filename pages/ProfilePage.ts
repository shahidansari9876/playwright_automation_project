import { Page, Locator } from '@playwright/test';
import { BASE_URL } from './env';

/**
 * The beneficiary (/beneficiary/profile) and volunteer (/volunteer/profile)
 * "View Profile" pages share the same Personal Information / Educational
 * Qualifications / Work Experience layout and dialog shapes (confirmed
 * live). Only the volunteer page additionally has a "Volunteer Experience"
 * section, covered by the volunteerExperience* methods below.
 */
export class ProfilePage {
  readonly page: Page;
  readonly BENEFICIARY_URL = `${BASE_URL}/beneficiary/profile`;
  readonly VOLUNTEER_URL = `${BASE_URL}/volunteer/profile`;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateAsBeneficiary(): Promise<void> {
    await this.page.goto(this.BENEFICIARY_URL, { waitUntil: 'networkidle' });
  }

  async navigateAsVolunteer(): Promise<void> {
    await this.page.goto(this.VOLUNTEER_URL, { waitUntil: 'networkidle' });
  }

  getDisplayNameHeading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  // The "Top Volunteers" sidebar list, present on both profile pages — each
  // entry shows the volunteer's name (and city/state) before it's clicked.
  // Matched by href pattern rather than traversing from the "Top Volunteers"
  // heading — /profile/:id is unique to this widget, and heading-relative
  // traversal (following-sibling, parent + getByRole('link')) both failed to
  // resolve against the live DOM despite matching the accessibility snapshot.
  getTopVolunteerLinks(): Locator {
    return this.page.locator('a[href^="/profile/"]');
  }

  // Scopes to the card containing this text (e.g. an institute/job/title
  // name) so Edit/Delete target the right entry when multiple exist. Must
  // also require an Edit/Delete button as a descendant — the innermost div
  // containing just the text (heading/course/dates) is a narrower wrapper
  // that does NOT itself contain the action buttons (confirmed live), so
  // filtering by text alone and taking .last() scopes too narrowly and the
  // subsequent button lookup hangs forever waiting for a button that will
  // never appear in that subtree.
  private cardContaining(text: string): Locator {
    return this.page
      .locator('div')
      .filter({ hasText: text })
      .filter({ has: this.page.getByRole('button', { name: /Edit|Delete/ }) })
      .last();
  }

  private async selectDialogOption(comboboxName: string, optionName: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('combobox', { name: comboboxName }).click();
    await this.page.getByRole('option', { name: optionName, exact: true }).click();
  }

  // Some delete actions raise a native window.confirm(); others show an
  // in-page "Are you sure?" dialog with its own Delete/Cancel buttons —
  // confirmed live: Educational Qualification delete uses native confirm(),
  // Volunteer Experience delete uses the custom in-page dialog. Handle both.
  private async confirmDelete(deleteButton: Locator): Promise<void> {
    this.page.once('dialog', (dialog) => dialog.accept());
    await deleteButton.click();
    await this.page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete', exact: true })
      .click({ timeout: 3000 })
      .catch(() => {});
  }

  // --- Edit Profile Details (name / photo / banner / preferred volunteer gender) ---

  async openEditProfileDetails(): Promise<void> {
    await this.page.getByRole('button', { name: 'Edit Profile Details' }).click();
  }

  async fillFirstName(name: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: /First Name/ }).fill(name);
  }

  async fillLastName(name: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Last Name' }).fill(name);
  }

  async getFirstNameValue(): Promise<string> {
    return this.page.getByRole('dialog').getByRole('textbox', { name: /First Name/ }).inputValue();
  }

  async getLastNameValue(): Promise<string> {
    return this.page.getByRole('dialog').getByRole('textbox', { name: 'Last Name' }).inputValue();
  }

  // The visible "Upload Profile Picture"/"Upload Banner" fields are styled
  // text inputs sitting in front of a real, hidden <input type="file"> —
  // confirmed live neither has an aria-label, so setInputFiles() targets
  // them positionally: profile picture is the first file input in the
  // dialog, banner the second.
  async uploadProfilePicture(filePath: string): Promise<void> {
    await this.page.getByRole('dialog').locator('input[type="file"]').nth(0).setInputFiles(filePath);
  }

  async uploadBannerPicture(filePath: string): Promise<void> {
    await this.page.getByRole('dialog').locator('input[type="file"]').nth(1).setInputFiles(filePath);
  }

  // After a file is chosen (before Submit), the styled text field's value
  // switches from "Current image" to the chosen file's name — confirmed
  // live — a quick pre-submit signal that the selection registered.
  async getProfilePictureFieldValue(): Promise<string> {
    return this.page.getByRole('dialog').getByRole('textbox', { name: 'Upload Profile Picture' }).inputValue();
  }

  async getBannerFieldValue(): Promise<string> {
    return this.page.getByRole('dialog').getByRole('textbox', { name: 'Upload Banner' }).inputValue();
  }

  // Matched by alt-text prefix rather than the full "... of <name>" / "...
  // for <name>" text, since the name portion changes when this same dialog
  // updates the display name — a prefix match stays valid regardless.
  getProfilePictureImage(): Locator {
    return this.page.locator('img[alt^="Profile picture of"]').first();
  }

  getCoverPhotoImage(): Locator {
    return this.page.locator('img[alt^="Cover photo for"]').first();
  }

  // "Preferred Volunteer Gender" (beneficiary-only — this field doesn't
  // exist on the volunteer's Edit Profile Details dialog) has no accessible
  // name of its own (confirmed live), but it's the only combobox in this
  // dialog, so an unnamed role query is unambiguous.
  async selectPreferredVolunteerGender(value: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('combobox').click();
    await this.page.getByRole('option', { name: value, exact: true }).click();
  }

  getPreferredVolunteerText(): Locator {
    return this.page.getByText(/^Preferred Volunteer:/);
  }

  async submitProfileDetails(): Promise<void> {
    await this.page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
  }

  // --- Edit Personal Information ---

  async openEditPersonalInformation(): Promise<void> {
    await this.page.getByRole('button', { name: 'Edit Personal Information' }).click();
  }

  async fillAlternatePhone(phone: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Alternate Phone' }).fill(phone);
  }

  // Labeled "Introduce Yourself" on the beneficiary dialog, "Bio" on the
  // volunteer one (confirmed live) — same field, different wording per role.
  async fillIntroduceYourself(bio: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: /Bio|Introduce Yourself/ }).fill(bio);
  }

  // "Save Changes" on the beneficiary dialog, "Submit" on the volunteer one
  // (confirmed live).
  async saveChanges(): Promise<void> {
    await this.page.getByRole('dialog').getByRole('button', { name: /Save Changes|Submit/ }).click();
  }

  // --- Institution Details (within Edit Personal Information; beneficiary
  // only — the volunteer's Edit Personal Information dialog has no
  // Institution Details section at all, confirmed live) ---

  private institutionDetailsGroup(): Locator {
    return this.page.getByRole('dialog').getByRole('group', { name: 'Institution details' });
  }

  // University Type has no accessible name of its own (confirmed live), but
  // it's always the first form control inside "Institution details" —
  // before Board/University and School/College — regardless of whether the
  // group is currently showing the PU or Other field set, so scoping there
  // and taking the first combobox is unambiguous either way.
  async selectUniversityType(value: 'PU' | 'Other'): Promise<void> {
    await this.institutionDetailsGroup().getByRole('combobox').first().click();
    await this.page.getByRole('option', { name: value, exact: true }).click();
  }

  // --- "Other" university type fields ---

  // Confirmed live: this textbox has no <label>, so Playwright falls back to
  // its placeholder ("Enter Board/University") as the accessible name.
  async fillBoardUniversityFreeText(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Enter Board/University' }).fill(value);
  }

  async fillSchoolCollegeNameFreeText(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'School / College Name' }).fill(value);
  }

  // --- "PU" university type fields ---

  async selectStudentType(value: string): Promise<void> {
    await this.page.getByRole('combobox', { name: 'Student Type *' }).click();
    await this.page.getByRole('option', { name: value, exact: true }).click();
  }

  // Search-driven official-college picker (same shape as the signup-time PU
  // flow): typing opens a suggestion list; the first option matching
  // optionText is clicked.
  async selectSchoolCollege(searchTerm: string, optionText: string | RegExp): Promise<void> {
    const combobox = this.page.getByRole('combobox', { name: 'School / College Name *' });
    await combobox.fill(searchTerm);
    const option = this.page.getByRole('option', { name: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
  }

  async fillPuEnrollmentNumber(value: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'University / PU Enrollment Number' }).fill(value);
  }

  // --- Professional Photo (uploaded from the View Profile page directly —
  // distinct from the beneficiary Complete Profile wizard's photo step;
  // needed e.g. when a beneficiary must add one after the fact to become
  // eligible to create PU semester exam requests) ---

  async hasProfessionalPhoto(): Promise<boolean> {
    return this.page
      .getByRole('heading', { name: 'Professional Photo', exact: true })
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
  }

  async clickUploadProfessionalPhoto(): Promise<void> {
    await this.page.getByRole('button', { name: 'Upload Professional Photo' }).click();
  }

  // Confirmed live: this dropzone opens a native file-chooser on click
  // (unlike the sr-only-input-behind-a-button pattern used elsewhere in this
  // suite) — the listener must be registered before/alongside the click,
  // since the event can fire as soon as the click resolves.
  async uploadProfessionalPhotoFile(filePath: string): Promise<void> {
    const [chooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.page.getByRole('dialog').getByText('Click to upload image').click(),
    ]);
    await chooser.setFiles(filePath);
  }

  async submitProfessionalPhotoUpload(): Promise<void> {
    await this.page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
  }

  // --- Educational Qualifications (shared by both roles) ---

  async clickAddEducation(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add Education' }).click();
  }

  async fillEducationCourse(course: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Course' }).fill(course);
  }

  async fillEducationInstitution(institution: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Institution' }).fill(institution);
  }

  async fillEducationLocation(location: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Location' }).fill(location);
  }

  async selectEducationStartDate(month: string, year: string): Promise<void> {
    await this.selectDialogOption('Start Date Month', month);
    await this.selectDialogOption('Start Date Year', year);
  }

  async checkEducationOngoing(): Promise<void> {
    await this.page.getByRole('dialog').getByRole('checkbox', { name: 'Ongoing' }).check();
  }

  async fillEducationNotes(notes: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Notes' }).fill(notes);
  }

  async submitEducation(): Promise<void> {
    await this.page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
  }

  async clickEditEducation(cardText: string): Promise<void> {
    await this.cardContaining(cardText).getByRole('button', { name: 'Edit Education' }).click();
  }

  async deleteEducation(cardText: string): Promise<void> {
    await this.confirmDelete(this.cardContaining(cardText).getByRole('button', { name: 'Delete Education' }));
  }

  // --- Work Experience (shared by both roles) ---

  async clickAddExperience(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add Experience' }).click();
  }

  async fillExperienceJobTitle(title: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Job Title' }).fill(title);
  }

  async fillExperienceOrganisation(org: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Organisation' }).fill(org);
  }

  async fillExperienceLocation(location: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Location' }).fill(location);
  }

  async selectExperienceStartDate(month: string, year: string): Promise<void> {
    await this.selectDialogOption('Start Date Month', month);
    await this.selectDialogOption('Start Date Year', year);
  }

  async checkExperienceOngoing(): Promise<void> {
    await this.page.getByRole('dialog').getByRole('checkbox', { name: 'Ongoing' }).check();
  }

  async fillExperienceNotes(notes: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Notes' }).fill(notes);
  }

  async submitExperience(): Promise<void> {
    await this.page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
  }

  async clickEditExperience(cardText: string): Promise<void> {
    await this.cardContaining(cardText).getByRole('button', { name: 'Edit Experience' }).click();
  }

  async deleteExperience(cardText: string): Promise<void> {
    await this.confirmDelete(this.cardContaining(cardText).getByRole('button', { name: 'Delete Work Experience' }));
  }

  // --- Volunteer Experience (volunteer profile only) ---

  async clickAddVolunteerExperience(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add Volunteer Experience' }).click();
  }

  async fillVolunteerExperienceTitle(title: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Title' }).fill(title);
  }

  async fillVolunteerExperienceLocation(location: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Location' }).fill(location);
  }

  async selectVolunteerExperienceStartDate(month: string, year: string): Promise<void> {
    await this.selectDialogOption('Start Date Month', month);
    await this.selectDialogOption('Start Date Year', year);
  }

  async checkVolunteerExperienceOngoing(): Promise<void> {
    await this.page.getByRole('dialog').getByRole('checkbox', { name: 'Ongoing' }).check();
  }

  async fillVolunteerExperienceNotes(notes: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: 'Notes' }).fill(notes);
  }

  async submitVolunteerExperience(): Promise<void> {
    await this.page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
  }

  async clickEditVolunteerExperience(cardText: string): Promise<void> {
    await this.cardContaining(cardText).getByRole('button', { name: 'Edit Volunteer Experience' }).click();
  }

  async deleteVolunteerExperience(cardText: string): Promise<void> {
    await this.confirmDelete(this.cardContaining(cardText).getByRole('button', { name: 'Delete Volunteer Experience' }));
  }
}
