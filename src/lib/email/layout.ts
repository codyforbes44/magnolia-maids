// Brand palette (kept in sync with src/styles.css)
export const BRAND = {
  primary: "#2f5d45", // magnolia leaf green
  ocean: "#1e3d2f", // deep forest
  accent: "#b98b3c", // warm brass
  turquoise: "#6b8a72", // sage
  ink: "#1b2620",
  body: "#3f4a44",
  muted: "#7a8580",
  hairline: "#e6e3da",
  soft: "#f5f3ec",
  softer: "#faf9f4",
  white: "#ffffff",
  gradient: "linear-gradient(135deg,#6b8a72 0%,#2f5d45 55%,#1e3d2f 100%)",
};

export const SITE = {
  name: "Magnolia Maids",
  tagline: "Upscale home cleaning in Durant, Oklahoma",
  url: "https://splash-miami-clean.lovable.app",
  supportEmail: "hello@bookme.bet",
  phone: "(580) 555-7822",
  address: "Durant, OK",
  fromDefault: "Magnolia Maids <bookings@bookme.bet>",
};

export const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export type LayoutOptions = {
  preview?: string;
  heroEmoji?: string;
  heroTitle: string;
  heroSubtitle?: string;
  accent?: string; // hex used for hero band + CTA
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

/**
 * Wraps body HTML in a polished, mobile-friendly, email-client-safe shell.
 * Inline styles only — no <style> blocks, no external CSS, no web fonts.
 */
export function renderLayout(bodyHtml: string, opts: LayoutOptions): string {
  const accent = opts.accent ?? BRAND.primary;
  const preview = esc(opts.preview ?? opts.heroSubtitle ?? opts.heroTitle);

  const cta =
    opts.ctaUrl && opts.ctaLabel
      ? `
        <tr><td align="center" style="padding:8px 24px 28px;">
          <a href="${esc(opts.ctaUrl)}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;font-family:Arial,Helvetica,sans-serif;font-size:15px;padding:14px 28px;border-radius:9999px;box-shadow:0 8px 20px rgba(14,165,233,0.35);">${esc(opts.ctaLabel)}</a>
        </td></tr>`
      : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${esc(opts.heroTitle)}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${BRAND.ink};">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${preview}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef6fb;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND.white};border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(2,132,199,0.12);">
          <!-- Header -->
          <tr><td style="padding:22px 28px;background:${BRAND.white};border-bottom:1px solid ${BRAND.hairline};">
            <table role="presentation" width="100%"><tr>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:${BRAND.ocean};letter-spacing:-0.5px;">
                🤍 ${esc(SITE.name)}
              </td>
              <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.muted};">
                ${esc(SITE.tagline)}
              </td>
            </tr></table>
          </td></tr>

          <!-- Hero -->
          <tr><td style="background:${opts.accent ? accent : BRAND.gradient};padding:36px 28px;text-align:center;color:#ffffff;">
            ${opts.heroEmoji ? `<div style="font-size:44px;line-height:1;margin-bottom:10px;">${opts.heroEmoji}</div>` : ""}
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:800;line-height:1.2;">${esc(opts.heroTitle)}</div>
            ${opts.heroSubtitle ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;opacity:0.95;margin-top:8px;">${esc(opts.heroSubtitle)}</div>` : ""}
          </td></tr>

          <!-- Body -->
          <tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;color:${BRAND.body};font-size:15px;line-height:1.55;">
            ${bodyHtml}
          </td></tr>

          ${cta}

          <!-- Footer -->
          <tr><td style="padding:20px 28px 26px;background:${BRAND.softer};border-top:1px solid ${BRAND.hairline};font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.muted};text-align:center;">
            ${opts.footerNote ? `<div style="margin-bottom:10px;color:${BRAND.body};">${opts.footerNote}</div>` : ""}
            <div style="font-weight:700;color:${BRAND.ocean};">${esc(SITE.name)} · ${esc(SITE.address)}</div>
            <div style="margin-top:4px;">
              <a href="mailto:${esc(SITE.supportEmail)}" style="color:${BRAND.ocean};text-decoration:none;">${esc(SITE.supportEmail)}</a>
              &nbsp;·&nbsp;
              <a href="tel:${esc(SITE.phone.replace(/[^0-9+]/g, ""))}" style="color:${BRAND.ocean};text-decoration:none;">${esc(SITE.phone)}</a>
            </div>
            <div style="margin-top:10px;">
              <a href="${esc(SITE.url)}" style="color:${BRAND.muted};text-decoration:underline;">Visit magnoliamaids.com</a>
              &nbsp;·&nbsp;
              <a href="${esc(SITE.url)}/privacy" style="color:${BRAND.muted};text-decoration:underline;">Privacy</a>
              &nbsp;·&nbsp;
              <a href="${esc(SITE.url)}/terms" style="color:${BRAND.muted};text-decoration:underline;">Terms</a>
            </div>
            <div style="margin-top:10px;color:${BRAND.muted};">
              You're receiving this because you interacted with Magnolia Maids. Reply to this email anytime — a real human reads it.
            </div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/* ------------ Small building blocks used across templates ------------ */

export function kvTable(rows: Array<[string, string | number | null | undefined]>) {
  const items = rows
    .filter(([, v]) => v !== undefined)
    .map(
      ([k, v]) =>
        `<tr>
           <td style="padding:10px 14px;background:${BRAND.softer};color:${BRAND.muted};font-weight:700;font-size:13px;width:38%;border-bottom:1px solid ${BRAND.hairline};">${esc(k)}</td>
           <td style="padding:10px 14px;color:${BRAND.ink};font-size:14px;border-bottom:1px solid ${BRAND.hairline};">${esc(v ?? "—")}</td>
         </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.hairline};border-radius:12px;overflow:hidden;margin:8px 0 4px;">${items}</table>`;
}

export function callout(title: string, body: string, tone: "info" | "success" | "warn" = "info") {
  const bg = tone === "success" ? "#ecfdf5" : tone === "warn" ? "#fff7ed" : BRAND.soft;
  const bd = tone === "success" ? "#a7f3d0" : tone === "warn" ? "#fed7aa" : "#bae6fd";
  const tt = tone === "success" ? "#047857" : tone === "warn" ? "#c2410c" : BRAND.ocean;
  return `<div style="background:${bg};border:1px solid ${bd};border-radius:12px;padding:14px 16px;margin:16px 0;">
    <div style="font-weight:800;color:${tt};font-size:14px;margin-bottom:4px;">${esc(title)}</div>
    <div style="color:${BRAND.body};font-size:14px;line-height:1.5;">${body}</div>
  </div>`;
}

export function timeline(steps: Array<{ label: string; time?: string; done?: boolean; current?: boolean }>) {
  const items = steps
    .map((s, i) => {
      const color = s.current ? BRAND.accent : s.done ? BRAND.turquoise : BRAND.hairline;
      const dot = `<td width="28" valign="top" style="padding-top:2px;">
          <div style="width:14px;height:14px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 0 0 2px ${color};margin:4px 0;"></div>
        </td>`;
      const rail =
        i < steps.length - 1
          ? `<div style="width:2px;background:${BRAND.hairline};margin-left:6px;height:22px;"></div>`
          : "";
      const text = `<td style="padding-bottom:6px;">
          <div style="font-weight:${s.current ? 800 : 600};color:${s.current ? BRAND.accent : BRAND.ink};font-size:14px;">${esc(s.label)}</div>
          ${s.time ? `<div style="color:${BRAND.muted};font-size:12px;">${esc(s.time)}</div>` : ""}
          ${rail}
        </td>`;
      return `<tr>${dot}${text}</tr>`;
    })
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0;">${items}</table>`;
}

export function paragraph(html: string) {
  return `<p style="margin:0 0 12px;color:${BRAND.body};font-size:15px;line-height:1.6;">${html}</p>`;
}

export function heading(text: string) {
  return `<h2 style="margin:18px 0 8px;color:${BRAND.ink};font-size:18px;font-weight:800;">${esc(text)}</h2>`;
}