/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load .env file
dotenv.config({ path: path.resolve(__dirname, ".env"), override: true });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Several spec files log into the same fixed live accounts (e.g. shahidstq@yopmail.com
   * is used by both otp-page.spec.ts and login-page.spec.ts). Different spec files run
   * in separate workers by default, so parallel workers fire concurrent login/OTP
   * requests at those shared accounts and race against each other on the backend.
   * Force a single worker so every test — across every file — runs strictly one at a time. */
  workers: 1,

  /**
   * Reporters:
   *  - html   → generates playwright-report/index.html (failure screenshots embedded automatically)
   *  - json   → generates test-results/results.json (read by global-teardown.js to build the email)
   */
  reporter: [
    [
      "html",
      {
        open: process.env.CI ? "never" : "on-failure",
        outputFolder: "playwright-report",
      },
    ],
    ["json", { outputFile: "test-results/results.json" }],
    ["./email-reporter.js"],
  ],

  use: {
    /* Base URL for the app under test */
    // baseURL: 'http://localhost:3000',

    /**
     * Screenshots: capture ONLY on failure.
     * These are automatically embedded in the HTML report next to the failed step.
     */
    screenshot: "only-on-failure",

    /**
     * Traces: collect on first retry so you can replay the full test in Trace Viewer.
     */
    trace: "on-first-retry",

    /* Video recording — enable if desired */
    // video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
