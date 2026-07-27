const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  reply_to?: string;
};

export async function sendResendEmail(input: SendEmailInput) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) {
    console.error("[resend] missing LOVABLE_API_KEY or RESEND_API_KEY");
    return { sent: false as const, reason: "not_configured" };
  }

  const from = input.from ?? "Splash <bookings@bookme.bet>";
  const to = Array.isArray(input.to) ? input.to : [input.to];

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from,
      to,
      subject: input.subject,
      html: input.html,
      reply_to: input.reply_to,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[resend] send failed [${res.status}]: ${body}`);
    return { sent: false as const, reason: `http_${res.status}`, body };
  }

  return { sent: true as const };
}