/** Shared Astro Maids styling for auth emails (kept in sync with src/lib/email/layout.ts). */
export const C = {
  primary: "#003594",
  forest: "#041E42",
  accent: "#869397",
  ink: "#041E42",
  body: "#041E42",
  muted: "#586873",
  hairline: "#D5DBDE",
  soft: "#F1F3F4",
  white: "#ffffff",
};

export const SUPPORT_EMAIL = "hello@magnoliamaids.pro";
export const SUPPORT_PHONE = "(214) 978-6445";

export const main = {
  backgroundColor: C.soft,
  fontFamily: "Georgia, 'Times New Roman', serif",
  margin: "0",
  padding: "24px 0",
};

export const container = {
  backgroundColor: C.white,
  border: `1px solid ${C.hairline}`,
  borderRadius: "16px",
  padding: "32px 32px 28px",
  maxWidth: "560px",
  margin: "0 auto",
};

export const eyebrow = {
  fontSize: "11px",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
  color: C.accent,
  fontFamily: "Arial, sans-serif",
  margin: "0 0 10px",
  fontWeight: "bold" as const,
};

export const h1 = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: C.forest,
  margin: "0 0 18px",
  lineHeight: "1.25",
};

export const text = {
  fontSize: "15px",
  color: C.body,
  lineHeight: "1.65",
  margin: "0 0 20px",
  fontFamily: "Arial, sans-serif",
};

export const link = { color: C.primary, textDecoration: "underline" };

export const button = {
  backgroundColor: C.primary,
  color: C.white,
  fontSize: "15px",
  fontWeight: "bold" as const,
  fontFamily: "Arial, sans-serif",
  borderRadius: "999px",
  padding: "14px 28px",
  textDecoration: "none",
  display: "inline-block",
};

export const codeBox = {
  fontSize: "30px",
  letterSpacing: "8px",
  fontWeight: "bold" as const,
  color: C.forest,
  backgroundColor: C.soft,
  border: `1px solid ${C.hairline}`,
  borderRadius: "12px",
  padding: "18px 12px",
  textAlign: "center" as const,
  margin: "0 0 24px",
  fontFamily: "Arial, sans-serif",
};

export const hr = { borderColor: C.hairline, margin: "28px 0 16px" };

export const footer = {
  fontSize: "12px",
  color: C.muted,
  lineHeight: "1.6",
  margin: "0",
  fontFamily: "Arial, sans-serif",
};
