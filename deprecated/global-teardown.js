// global-teardown.js
// Runs automatically after the full Playwright test suite completes.
// Reads the JSON results file, builds an HTML email, zips the HTML report,
// and sends everything via Nodemailer.

'use strict';

const dotenv    = require('dotenv');
const nodemailer = require('nodemailer');
const fs        = require('fs');
const path      = require('path');
const { ZipArchive } = require('archiver');
const { execSync } = require('child_process');

dotenv.config();

// ─── Paths ────────────────────────────────────────────────────────────────────
const RESULTS_JSON  = path.join(__dirname, 'test-results', 'results.json');
const REPORT_DIR    = path.join(__dirname, 'playwright-report');
const REPORT_ZIP    = path.join(__dirname, 'test-results', 'playwright-report.zip');

// ─── Zip the HTML report folder ───────────────────────────────────────────────
async function zipReport() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(REPORT_DIR)) {
      console.warn('[teardown] No playwright-report folder found — skipping zip.');
      return resolve(null);
    }

    const output  = fs.createWriteStream(REPORT_ZIP);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`[teardown] Report zipped: ${archive.pointer()} bytes`);
      resolve(REPORT_ZIP);
    });
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(REPORT_DIR, 'playwright-report');
    archive.finalize();
  });
}

// ─── Parse results.json ───────────────────────────────────────────────────────
function parseResults() {
  if (!fs.existsSync(RESULTS_JSON)) {
    console.warn('[teardown] results.json not found — using empty stats.');
    return { passed: 0, failed: 0, skipped: 0, total: 0, failures: [] };
  }

  const raw  = JSON.parse(fs.readFileSync(RESULTS_JSON, 'utf-8'));
  let passed = 0, failed = 0, skipped = 0;
  const failures = [];

  // Playwright JSON reporter structure: { suites: [ { specs: [ { tests: [...] } ] } ] }
  function walkSuites(suites) {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? []) {
        for (const test of spec.tests ?? []) {
          const status = test.results?.[test.results.length - 1]?.status;
          if (status === 'passed')  passed++;
          else if (status === 'failed' || status === 'timedOut') {
            failed++;
            failures.push(`${spec.title} — ${test.results?.[test.results.length - 1]?.error?.message ?? 'No message'}`);
          }
          else if (status === 'skipped') skipped++;
        }
      }
      walkSuites(suite.suites);
    }
  }

  walkSuites(raw.suites);
  return { passed, failed, skipped, total: passed + failed + skipped, failures };
}

// ─── Build HTML email body ─────────────────────────────────────────────────────
function buildHtml({ passed, failed, skipped, total, failures }) {
  const statusColor = failed > 0 ? '#c0392b' : '#27ae60';
  const statusLabel = failed > 0 ? '❌ FAILED' : '✅ PASSED';

  const failureRows = failures.length
    ? failures.map(f => `<li style="margin-bottom:6px;color:#c0392b;">${f}</li>`).join('')
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:24px;margin:0;">
  <div style="max-width:640px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">

    <!-- Header -->
    <div style="background:#1a1a2e;padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">🤖 STQ Automation Report</h1>
      <p style="color:#aaa;margin:4px 0 0;">Save The Quest — Playwright Test Suite</p>
    </div>

    <!-- Status banner -->
    <div style="background:${statusColor};padding:16px 32px;">
      <h2 style="color:#fff;margin:0;font-size:24px;">${statusLabel}</h2>
    </div>

    <!-- Summary -->
    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;color:#555;">Total Tests</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:bold;text-align:right;">${total}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;color:#27ae60;">✅ Passed</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:bold;text-align:right;color:#27ae60;">${passed}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;color:#c0392b;">❌ Failed</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:bold;text-align:right;color:#c0392b;">${failed}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#e67e22;">⏭️ Skipped</td>
          <td style="padding:10px 0;font-weight:bold;text-align:right;color:#e67e22;">${skipped}</td>
        </tr>
      </table>

      ${failures.length ? `
      <h3 style="margin-top:24px;color:#c0392b;font-size:15px;">Failed Tests</h3>
      <ul style="padding-left:18px;font-size:14px;line-height:1.7;">${failureRows}</ul>
      ` : ''}

      <!-- Report note -->
      <div style="margin-top:24px;background:#f8f9fa;border-left:4px solid #1a1a2e;padding:12px 16px;border-radius:4px;font-size:13px;color:#555;">
        📎 <strong>Full HTML Report</strong> is attached as <code>playwright-report.zip</code>.<br>
        Unzip it and open <code>playwright-report/index.html</code> in your browser to see<br>
        detailed steps, screenshots of failures, and traces.
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f0f0f0;padding:16px 32px;font-size:12px;color:#999;text-align:center;">
      Generated by Playwright + Nodemailer • ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
    </div>
  </div>
</body>
</html>`;
}

// ─── Main teardown export (CommonJS style) ─────────────────────────────────────
module.exports = async function globalTeardown() {
  console.log('\n[teardown] Preparing test result email…');

  // 1. Parse results
  const stats = parseResults();
  console.log(`[teardown] Results → Passed:${stats.passed} Failed:${stats.failed} Skipped:${stats.skipped}`);

  // 2. Zip HTML report
  const zipPath = await zipReport();



  // 4. Validate env vars
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO, EMAIL_CC } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_TO) {
    console.error('[teardown] ⚠️  Missing required email env vars (SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_TO). Email NOT sent.');
    return;
  }

  // 5. Create transporter
  const transporter = nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   parseInt(SMTP_PORT ?? '587', 10),
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  // 6. Build message
  const subject = `Automation Result for STQ — ${stats.failed > 0 ? '❌ FAILED' : '✅ PASSED'} (${stats.passed}/${stats.total} passed)`;

  const mailOptions = {
    from:    EMAIL_FROM ?? SMTP_USER,
    to:      EMAIL_TO,
    cc:      EMAIL_CC || undefined,
    subject,
    html:    buildHtml(stats),
    attachments: zipPath ? [{ filename: 'playwright-report.zip', path: zipPath }] : [],
  };

  // 7. Send
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[teardown] ✅ Email sent → ${info.messageId}`);
  } catch (err) {
    console.error('[teardown] ❌ Failed to send email:', err.message);
  }
};
