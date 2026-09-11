import { Page } from '@playwright/test';
import { BASE_URL } from './env';

/**
 * Beneficiary/volunteer messaging thread (/beneficiary/messages and
 * /volunteer/messages, both keyed by ?conversation_id=). Confirmed live to be
 * real-time — a message sent by one side appears on the other within a
 * couple of seconds with no reload needed. Reached either by navigating
 * directly with a known conversation_id, or via
 * ExamActivityPage.clickChatButton() from an accepted exam, which redirects
 * here and adds conversation_id to the URL.
 */
export class ChatPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateAsBeneficiary(conversationId: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/beneficiary/messages?conversation_id=${conversationId}`, { waitUntil: 'networkidle' });
  }

  async navigateAsVolunteer(conversationId: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/volunteer/messages?conversation_id=${conversationId}`, { waitUntil: 'networkidle' });
  }

  // Both /beneficiary/messages and /volunteer/messages carry the open
  // thread's id as this query param once a conversation is loaded.
  getConversationIdFromUrl(): string {
    const id = new URL(this.page.url()).searchParams.get('conversation_id');
    if (!id) {
      throw new Error(`Expected a conversation_id query param in the current URL, got: ${this.page.url()}`);
    }
    return id;
  }

  async sendMessage(text: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Type a Message' }).fill(text);
    await this.page.getByRole('button', { name: 'Send Message' }).click();
  }

  // The message-thread scroll container, distinct from the sidebar's own
  // conversation-list scroll container. Neither exposes a role, aria-label,
  // or data-testid to scope by, but confirmed live via class inspection that
  // only this one also carries p-3 padding (both share
  // flex-1/min-h-0/overflow-y-auto). Scoping here matters: the sidebar shows
  // every conversation's *last message* as a text preview, which duplicates
  // whatever that same message also renders as inside the open thread — an
  // unscoped page.getByText(exactMessageText) matches both and throws a
  // strict-mode violation. This isn't just a risk from reusing message text
  // across runs: it happens on the very first message of a fresh
  // conversation too, since that message is simultaneously the open
  // thread's only bubble AND that same thread's own sidebar preview.
  private messagePanel() {
    return this.page.locator('.flex-1.min-h-0.overflow-y-auto.p-3');
  }

  // Message text is unique per test, so a plain text locator (scoped to the
  // open thread) is enough to confirm receipt — no need to distinguish
  // sender/receiver bubble styling.
  messageLocator(text: string) {
    return this.messagePanel().getByText(text);
  }
}
