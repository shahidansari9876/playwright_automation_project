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

  // --- Edit Profile Details (name / photo / banner) ---

  async openEditProfileDetails(): Promise<void> {
    await this.page.getByRole('button', { name: 'Edit Profile Details' }).click();
  }

  async fillFirstName(name: string): Promise<void> {
    await this.page.getByRole('dialog').getByRole('textbox', { name: /First Name/ }).fill(name);
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
