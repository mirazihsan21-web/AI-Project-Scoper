import { Resend } from "resend";

export type OutgoingEmail = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
  attachments: { filename: string; content: Buffer }[];
};

/** Sends an email or throws, so callers can record whether the owner was notified. */
export type SendEmail = (email: OutgoingEmail) => Promise<void>;

export function createResendSender(apiKey: string): SendEmail {
  const resend = new Resend(apiKey);
  return async (email) => {
    // Resend reports failures in the result instead of throwing.
    const { error } = await resend.emails.send(email);
    if (error) throw new Error(`Resend rejected the email: ${error.name}: ${error.message}`);
  };
}

/** Used when SCOPER_FAKE_EMAIL=1 (e2e tests), so test runs never send real email. */
export const fakeSender: SendEmail = async () => {};
