import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY || "");
  }
  return resendInstance;
}

export async function sendConfirmationEmail(
  to: string,
  playerName: string,
  paymentStatus: string
) {
  const isPaid = paymentStatus === "paid_online";

  await getResend().emails.send({
    from: "The Caz Masters <noreply@yourdomain.com>",
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
          <p style="margin: 4px 0;"><strong>Date:</strong> July 4th Weekend, 2026</p>
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
