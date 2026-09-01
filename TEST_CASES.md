# Test Suite Overview

This document lists every test case currently implemented in `tests/*.spec.ts` — what each spec file covers and what each individual test verifies. It reflects the code as written; it is not a run report.

**Total: 45 test cases across 8 spec files.**

---

## Auth & Onboarding

### `login-page.spec.ts` — Login Page: sanity, positive, negative, edge cases (7)

- Sanity check: Login page loads and title is correct
- TC-003: Login failure with invalid email format (`invalid@test`)
- TC-004: Login failure with empty email field
- TC-006: Login failure with non-existent email (`nonexistent@yopmail.com`)
- TC-007: Login failure with invalid email format (missing domain)
- TC-012: Email with extra spaces (`  shahidstq@yopmail.com  `)
- TC-014: Email case sensitivity test (`SHAHIDSTQ@YOPMAIL.COM`)

### `otp-page.spec.ts` — OTP Page: positive, negative, edge cases (7)

- TC-001: Valid email + valid OTP (123456) → successful login
- TC-002: Valid email + invalid OTP (000000) → rejection
- TC-005: Login failure with empty OTP field
- TC-008: OTP entry with special characters (`!@#$%^`)
- TC-009: OTP entry with insufficient digits (`123`)
- TC-010: OTP entry with spaces (`12 34 56`)
- TC-011: OTP entry with letters (`ABCDEF`)
- TC-013: Very long OTP entry (`123456789012345`)

### `signup-page.spec.ts` — Sign Up Page: sanity, positive, negative, edge cases (3)

- Sanity check: Sign up page navigation
- TC-015 (positive): Sign up with valid details
- TC-016 (negative): Empty fields rejection

### `beneficiary-profile-fields.spec.ts` — Beneficiary Profile: field-level functional checks (4)

Form is deliberately never submitted; the account never completes registration.

- TC-Setup-002: Fill every field and verify conditional UI behaviour
- TC-Setup-003 (positive): every "Highest Education" value (all 13) drives the correct conditional block — Degree Type, Education Status, Parent/Guardian fields — per a documented matrix
- TC-Setup-004 (positive): Education Status branch, PU ↔ Other university-type round trip, pincode auto-fill, Terms checkbox gating Submit
- TC-Setup-005 (negative): invalid input is rejected and never auto-fills

---

## End-to-End Exam Flows

### `pu-semester-exam-flow.spec.ts` — PU Semester Exam End-to-End Flow (`puflow.md`) (8, serial, fresh signups)

1. Beneficiary: sign up, verify OTP, complete profile (PU institution flow)
2. Admin: verify all three beneficiary documents
3. Volunteer: sign up, verify OTP, complete profile (Other institution flow)
4. Admin → Volunteer: identity document rejection and resubmission demo
5. Beneficiary: create PU Semester Exam request
6. Volunteer: accept the PU Semester Exam request (professional photo + education doc gate)
7. Admin: COE verification rejection, resubmission, and re-verification
8. Exam completion and volunteer payout

### `non-pu-exam-flow.spec.ts` — Non-PU (Regular) Exam End-to-End Flow (`nonPUflow.md`) (6, serial, shared accounts)

1. Beneficiary: create a regular (non-PU) exam request
2. Admin: verify the request is not a PU Semester flow
3. Volunteer: accept the request directly (no PU requirements gate)
4. Admin: force-end the exam for testing
5. Exam completion and volunteer payout
6. Admin: mark the payout Completed, and volunteer confirms it (in their Payouts tab)

---

## Profile Management

### `profile-management.spec.ts` — Beneficiary + Volunteer profile CRUD (9, two serial blocks)

**Beneficiary Profile Management (4)**

- Edit Profile Details: update name (then revert), photo, banner, and preferred volunteer gender
- Edit Personal Information: update alternate phone and bio
- Educational Qualifications: add, edit, and delete
- Work Experience: add, edit, and delete

**Volunteer Profile Management (5)**

- Edit Profile Details: update name (then revert), photo, and banner (no gender dropdown on this role)
- Edit Personal Information: update alternate phone and bio
- Educational Qualifications: add, edit, and delete
- Work Experience: add, edit, and delete
- Volunteer Experience: add, edit, and delete (volunteer-only section)

### `top-volunteer-profile.spec.ts` — Beneficiary Profile: Top Volunteers link verification (1)

- Each Top Volunteer entry opens a matching, populated profile page: for every listed volunteer, captures the name shown before clicking, follows the link to their public `/profile/:id` page, and verifies that page shows a matching name heading and populated content rather than an error. Uses `expect.soft()` so every entry is checked even after an earlier one fails, plus a screenshot per broken entry.
  - **Currently fails by design** — `/profile/:id` is a known-broken route on the test server (every volunteer ID tried returns "Volunteer not found"); this test exists to detect when that bug is fixed, not to be "fixed" itself.

---

## Notes

- Most specs reuse two shared, long-lived accounts (`shahidstq@yopmail.com` beneficiary, `shahid@yopmail.com` volunteer) rather than signing up fresh each run; `pu-semester-exam-flow.spec.ts` and `beneficiary-profile-fields.spec.ts` are the exceptions, using fresh/dedicated accounts.
- `playwright.config.ts` forces `workers: 1` to avoid concurrent-login races on the shared accounts.
- Tests run against whichever environment is active in `.env` (`BASE_URL`/`ADMIN_BASE_URL`) — test server vs production.
