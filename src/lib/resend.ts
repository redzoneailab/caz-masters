import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY || "");
  }
  return resendInstance;
}

const FROM_ADDRESS = "The Caz Masters <noreply@yourdomain.com>";

export async function sendMagicLinkEmail(to: string, url: string) {
  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Sign in to The Caz Masters",
    html: `
      <div style="background-color: #0a1628; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; background: #111d33; border-radius: 16px; overflow: hidden;">
          <div style="padding: 32px 24px; text-align: center; border-bottom: 2px solid #d4a030;">
            <h1 style="color: white; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; margin: 0;">
              The Caz Masters
            </h1>
          </div>
          <div style="padding: 40px 24px; text-align: center;">
            <h2 style="color: white; font-size: 20px; font-weight: 700; margin: 0 0 12px;">
              Sign In
            </h2>
            <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
              Click the button below to sign in to your Caz Masters account.
            </p>
            <a href="${url}" style="display: inline-block; background: #d4a030; color: #0a1628; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 36px; border-radius: 12px; text-decoration: none;">
              Sign In
            </a>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 28px 0 0;">
              This link expires in 24 hours.<br />
              If you didn&rsquo;t request this, you can safely ignore it.
            </p>
          </div>
          <div style="padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center;">
            <p style="color: #475569; font-size: 12px; margin: 0;">
              The Caz Masters &middot; Cazenovia Golf Club
            </p>
          </div>
        </div>
      </div>
    `,
  });
}

export async function sendConfirmationEmail(
  to: string,
  playerName: string,
  paymentStatus: string
) {
  const isPaid = paymentStatus === "paid_online";

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "You're Registered for The Caz Masters 2026!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #15803d; font-size: 28px;">Welcome to The Caz Masters!</h1>
        <p style="font-size: 16px; color: #333;">Hey ${playerName},</p>
        <p style="font-size: 16px; color: #333;">
          You're officially registered for the 15th Annual Caz Masters tournament!
        </p>
        <div style="background: #f0fdf0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Date:</strong> Friday, July 3rd, 2026</p>
          <p style="margin: 4px 0;"><strong>Location:</strong> Cazenovia Golf Club</p>
          <p style="margin: 4px 0;"><strong>Payment:</strong> ${isPaid ? "Paid - You're all set!" : "Pay day-of at check-in ($150)"}</p>
        </div>
        ${!isPaid ? '<p style="font-size: 14px; color: #666;">Remember to bring $150 cash or be ready to pay at check-in.</p>' : ""}
        <p style="font-size: 16px; color: #333;">See you on the course!</p>
        <p style="font-size: 14px; color: #999; margin-top: 40px;">The Caz Masters Golf Tournament</p>
      </div>
    `,
  });
}
