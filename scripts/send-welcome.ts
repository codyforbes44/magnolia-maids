import { renderAdminWelcome } from "../src/lib/email/admin-welcome";
import { sendResendEmail } from "../src/lib/resend.server";

const r = renderAdminWelcome({
  name: "Desiree Ramos",
  email: "desiree@magnoliamaids.com",
  note: "You now have full admin access — same view of the business as Cody, nothing hidden.",
});
const res = await sendResendEmail({
  to: "desiree@magnoliamaids.com",
  subject: r.subject,
  html: r.html,
  reply_to: "hello@magnoliamaids.pro",
  kind: "admin_welcome",
  idempotencyKey: "admin-welcome-desiree-2026-08",
});
console.log(JSON.stringify(res));
