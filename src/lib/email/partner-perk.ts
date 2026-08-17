import { BRAND, SITE, esc } from "./layout";
import { PLANIT, PLANIT_DEFAULT_CODE, planitClaimUrl } from "../partners";

/**
 * Branded plan.It Family block appended to booking and quote confirmations.
 * `code` comes from business settings at send time; falls back to the default.
 */
export function planitPerkBlock(
  code: string = PLANIT_DEFAULT_CODE,
  audience: "client" | "team" = "client",
): string {
  const logo = `${SITE.url}${PLANIT.logo}`;
  const label = audience === "team" ? "Team perk" : "Client perk";
  const eligibility =
    audience === "team"
      ? "free for you as a member of the Magnolia Maids crew"
      : "free for you while you're on a recurring Magnolia Maids plan";
  const seatsNote =
    audience === "team"
      ? `No card required. Up to ${PLANIT.seats} seats for your household — yours to keep using while you're on the team.`
      : `No card required. Up to ${PLANIT.seats} seats for your household.`;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0;border:1px solid ${BRAND.hairline};border-radius:16px;background:${BRAND.softer};">
    <tr>
      <td style="padding:22px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:12px;" valign="middle">
              <img src="${esc(logo)}" width="40" height="40" alt="plan.It" style="display:block;border-radius:10px;" />
            </td>
            <td valign="middle">
              <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${BRAND.muted};font-weight:700;">${esc(label)}</div>
              <div style="font-size:18px;color:${BRAND.ink};font-weight:700;">plan.It ${esc(PLANIT.plan)} — free for you</div>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:${BRAND.body};">
          ${esc(PLANIT.summary)} It's normally $${PLANIT.monthly}/mo ($${PLANIT.annualValue} a year) — and it's
          ${eligibility}.
        </p>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:${BRAND.body};">
          Your redemption code: <strong style="color:${BRAND.forest};letter-spacing:.04em;">${esc(code)}</strong>
        </p>
        <p style="margin:16px 0 0;">
          <a href="${esc(planitClaimUrl(code))}" style="display:inline-block;background:${BRAND.accent};color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:15px;">Claim your plan.It ${esc(PLANIT.plan)} seat</a>
        </p>
        <p style="margin:12px 0 0;font-size:12px;color:${BRAND.muted};">${seatsNote}</p>
      </td>
    </tr>
  </table>`;
}
