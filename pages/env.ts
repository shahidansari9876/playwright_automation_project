import console from 'console';
import dotenv from 'dotenv';
import path from 'path';

// Page objects import this module directly, so load .env here too rather
// than relying on playwright.config.ts having run first.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

// Flip which line is active in .env (BASE_URL / ADMIN_BASE_URL) to move every
// page object between the test server and production in one place.
export const BASE_URL = stripTrailingSlash(process.env.BASE_URL || 'https://testing.thescribebank.com');
export const ADMIN_BASE_URL = stripTrailingSlash(process.env.ADMIN_BASE_URL || 'https://adminpanel-testing.thescribebank.com');


console.log(BASE_URL)
console.log(ADMIN_BASE_URL)