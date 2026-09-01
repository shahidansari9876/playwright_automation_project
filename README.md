# TheScribeBank (STQ) — Playwright Test Suite

End-to-end and functional Playwright test suite for **TheScribeBank / Save The Quest**, a platform connecting beneficiaries (people needing exam scribes) with volunteers, with an admin panel for verification and payouts. Written in TypeScript using the Page Object Model pattern.

## 📋 Project Structure

```
├── pages/                          # Page Object Model classes
│   ├── env.ts                      # BASE_URL / ADMIN_BASE_URL, loaded from .env
│   ├── index.ts                    # Barrel export for all page objects
│   ├── LoginPage.ts / OtpPage.ts / SignUpPage.ts
│   ├── SetupProfilePage.ts / RegistrationPage.ts / PuFlowProfilePage.ts
│   ├── ProfileDocumentsPage.ts / ProfilePage.ts
│   ├── ExamRequestPage.ts / ExamActivityPage.ts / PaymentMethodsPage.ts
│   ├── AdminLoginPage.ts / AdminReviewPage.ts / AdminCoeVerificationPage.ts
│   └── AdminPayoutsPage.ts / VolunteerPayoutsPage.ts
├── tests/                          # Playwright spec files (see TEST_CASES.md)
│   ├── login-page.spec.ts
│   ├── otp-page.spec.ts
│   ├── signup-page.spec.ts
│   ├── beneficiary-profile-fields.spec.ts
│   ├── pu-semester-exam-flow.spec.ts
│   ├── non-pu-exam-flow.spec.ts
│   ├── profile-management.spec.ts
│   └── top-volunteer-profile.spec.ts
├── images/                         # Fixture files used by upload tests (gitignored)
├── puflow.md / nonPUflow.md        # Manually-authored step-by-step flow docs the E2E specs implement
├── TEST_CASES.md                   # Full list of every test case in the suite
├── email-reporter.js               # Custom Playwright reporter — emails the run summary
├── playwright.config.ts            # Playwright configuration
├── .env                            # Local environment config (gitignored)
└── .env.example                    # Template for .env
```

## 🌐 Environments

The whole suite points at either the **test server** or **production** via `.env` — no code changes needed. `pages/env.ts` reads these and every page object builds its URLs from them:

```bash
# testing server
BASE_URL=https://testing.thescribebank.com
ADMIN_BASE_URL=https://adminpanel-testing.thescribebank.com

# production server (swap in instead)
# BASE_URL=https://thescribebank.com
# ADMIN_BASE_URL=https://adminpanel.thescribebank.com
```

Copy `.env.example` to `.env` and fill in real values before running anything.

Logins on the test server accept a fixed **master OTP (`123456`)** by appending `?masterOtp=true` to the login URL — all specs use this instead of reading real inbox mail.

## ✅ Test Coverage

45 test cases across 8 spec files — login, OTP, sign-up, beneficiary profile-setup field logic, two full exam flows (PU-semester and non-PU), profile management (edit details/personal info, education, work & volunteer experience CRUD), and a Top-Volunteers link regression check.

See **[TEST_CASES.md](./TEST_CASES.md)** for the full breakdown of every test case per file.

Most specs reuse two shared, long-lived accounts (`shahidstq@yopmail.com` beneficiary, `shahid@yopmail.com` volunteer) rather than signing up fresh each run — `pu-semester-exam-flow.spec.ts` and `beneficiary-profile-fields.spec.ts` are the exceptions.

## 🚀 How to Run Tests

```bash
# Run the entire suite
npx playwright test

# Run a single spec file
npx playwright test tests/profile-management.spec.ts

# Run with headed browser (watch it run)
npx playwright test tests/login-page.spec.ts --headed

# Run a specific test by name
npx playwright test --grep "Educational Qualifications"

# Debug mode (step through)
npx playwright test tests/otp-page.spec.ts --debug

# Type-check the project without running tests
npm run typecheck
```

Tests always run **single-worker** (`workers: 1` in `playwright.config.ts`) — several spec files log into the same shared accounts, and parallel workers would race concurrent logins/OTP requests against them.

## 📊 Reporting

Three reporters run on every execution:

- **HTML** → `playwright-report/index.html` (opens automatically on failure locally), with failure screenshots embedded
- **JSON** → `test-results/results.json`
- **Email** (`email-reporter.js`) → sends a run summary via the SMTP settings in `.env`

```bash
npx playwright show-report
```

Screenshots for failed tests, plus any test-authored screenshots (e.g. `top-volunteer-profile.spec.ts`), are saved under `test-results/`.

## 🔧 Configuration

`playwright.config.ts` controls:

- Browser projects (currently Chromium only; Firefox/WebKit commented out)
- `workers: 1` (see above — do not change without addressing the shared-account race)
- `screenshot: 'only-on-failure'`, `trace: 'on-first-retry'`
- Retries (2 on CI, 0 locally)

## 🧩 Page Object Model conventions

- Every page object lives in `pages/`, imports `BASE_URL`/`ADMIN_BASE_URL` from `pages/env.ts`, and is re-exported from `pages/index.ts` for import as `import { LoginPage, ProfilePage } from '../pages'`.
- Prefer `.waitFor({ state: 'visible' }).then/catch` over `isVisible()` for boolean checks — `isVisible()` does not wait and can race SPA navigation.
- Use `expect.soft()` when a test needs to check several independent entries without stopping at the first failure (e.g. iterating over a list).

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Best Practices](https://playwright.dev/docs/pom)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)

---

**Last Updated:** 2026-08-31
