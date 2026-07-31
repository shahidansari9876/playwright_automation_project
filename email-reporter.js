// email-reporter.js
// Custom Playwright reporter that runs after the test execution completes,
// waits for results.json to be flushed, zips the HTML report, and sends it via email.

'use strict';

const fs = require('fs');
const path = require('path');
const { ZipArchive } = require('archiver');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const REPORT_DIR = path.join(__dirname, 'playwright-report');
const REPORT_ZIP = path.join(__dirname, 'test-results', 'playwright-report.zip');
const RESULTS_JSON = path.join(__dirname, 'test-results', 'results.json');

class EmailReporter {
  async onEnd(result) {
    console.log(`\n[email-reporter] Test suite run completed with status: ${result.status}`);

    // Wait 2 seconds for other reporters (JSON & HTML) to finish writing files to disk
    console.log('[email-reporter] Waiting for report generation to finish…');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 1. Parse results.json
    const stats = this.parseResults();
    console.log(`[email-reporter] Stats gathered → Passed: ${stats.passed}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`);

    // 2. Zip the HTML report folder
    const zipPath = await this.zipReport();

    // 3. Validate env vars
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO, EMAIL_CC, REPORT_URL } = process.env;
    console.log(`[email-reporter] Loaded configuration → Host: ${SMTP_HOST}, Port: ${SMTP_PORT}, User: ${SMTP_USER}, From: ${EMAIL_FROM}, To: ${EMAIL_TO}`);
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_TO) {
      console.error('[email-reporter] ⚠️ Missing required email env vars (SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_TO). Email NOT sent.');
      return;
    }

    const reportUrl = REPORT_URL || 'http://localhost:9323/';

    // Free the port of any previous report server process to guarantee the new one starts on this port
    this.killProcessOnPort(reportUrl);

    // 4. Create transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT ?? '587', 10),
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    // 5. Build message
    const subject = `Automation Result for STQ — ${stats.failed > 0 ? '❌ FAILED' : '✅ PASSED'} (${stats.passed}/${stats.total} passed)`;

    const mailOptions = {
      from: EMAIL_FROM ?? SMTP_USER,
      to: EMAIL_TO,
      cc: EMAIL_CC || undefined,
      subject,
      html: this.buildHtml(stats, reportUrl),
      attachments: zipPath ? [{ filename: 'playwright-report.zip', path: zipPath }] : [],
    };

    // 5. Send
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[email-reporter] ✅ Email sent successfully → ${info.messageId}`);
    } catch (err) {
      console.error('[email-reporter] ❌ Failed to send email:', err.message);
    }
  }

  killProcessOnPort(reportUrl) {
    let port = '9323';
    try {
      const parsedUrl = new URL(reportUrl);
      if (parsedUrl.port) {
        port = parsedUrl.port;
      }
    } catch (e) {
      // Keep default 9323
    }

    const { execSync } = require('child_process');
    try {
      if (process.platform === 'win32') {
        const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
        const lines = stdout.split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5 && parts[1].endsWith(`:${port}`) && parts[3] === 'LISTENING') {
            const pid = parts[4];
            execSync(`taskkill /F /PID ${pid}`);
            console.log(`[email-reporter] Closed previous report server (PID: ${pid}) on port ${port}`);
          }
        }
      } else {
        execSync(`lsof -t -i:${port} | xargs kill -9 2>/dev/null || true`);
        console.log(`[email-reporter] Closed previous report server on port ${port}`);
      }
    } catch (e) {
      // Ignore errors if no process is running on that port
    }
  }

  async zipReport() {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(REPORT_DIR)) {
        console.warn('[email-reporter] No playwright-report folder found — skipping zip.');
        return resolve(null);
      }

      const output = fs.createWriteStream(REPORT_ZIP);
      const archive = new ZipArchive({ zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`[email-reporter] Report zipped successfully: ${archive.pointer()} bytes`);
        resolve(REPORT_ZIP);
      });
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(REPORT_DIR, 'playwright-report');
      archive.finalize();
    });
  }

  parseResults() {
    if (!fs.existsSync(RESULTS_JSON)) {
      console.warn('[email-reporter] results.json not found — using empty stats.');
      return { passed: 0, failed: 0, skipped: 0, total: 0, failures: [] };
    }

    try {
      const raw = JSON.parse(fs.readFileSync(RESULTS_JSON, 'utf-8'));
      let passed = 0, failed = 0, skipped = 0;
      const failures = [];

      // Playwright JSON reporter structure: { suites: [ { specs: [ { tests: [...] } ] } ] }
      const walkSuites = (suites) => {
        for (const suite of suites ?? []) {
          for (const spec of suite.specs ?? []) {
            for (const test of spec.tests ?? []) {
              const status = test.results?.[test.results.length - 1]?.status;
              if (status === 'passed') passed++;
              else if (status === 'failed' || status === 'timedOut') {
                failed++;
                const errorMsg = test.results?.[test.results.length - 1]?.error?.message ?? 'No message';
                failures.push(`${spec.title} — ${errorMsg}`);
              }
              else if (status === 'skipped') skipped++;
            }
          }
          walkSuites(suite.suites);
        }
      };

      walkSuites(raw.suites);
      return { passed, failed, skipped, total: passed + failed + skipped, failures };
    } catch (e) {
      console.error('[email-reporter] Error parsing results.json:', e.message);
      return { passed: 0, failed: 0, skipped: 0, total: 0, failures: [] };
    }
  }

  buildHtml({ passed, failed, skipped, total, failures }, reportUrl) {
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

      <!-- Report Link & Attachment Note -->
      <div style="margin-top:24px;text-align:center;">
        <a href="${reportUrl}" target="_blank" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:15px;box-shadow:0 2px 4px rgba(0,0,0,0.15);">
          🌐 View Full HTML Report
        </a>
        <p style="margin:8px 0 0;font-size:12px;color:#666;">
          Report served at: <a href="${reportUrl}" target="_blank" style="color:#1a1a2e;text-decoration:underline;">${reportUrl}</a>
        </p>
        <div style="margin-top:16px;background:#f8f9fa;border-left:4px solid #1a1a2e;padding:12px 16px;border-radius:4px;font-size:13px;color:#555;text-align:left;display:inline-block;max-width:480px;">
          📎 <strong>Full HTML Report</strong> is also attached as <code>playwright-report.zip</code>.<br>
          Unzip it and open <code>playwright-report/index.html</code> in your browser to see offline steps and traces.
        </div>
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
}

module.exports = EmailReporter;
