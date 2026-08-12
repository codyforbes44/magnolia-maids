import { BRAND, esc, heading, kvTable, paragraph, renderLayout } from "./layout";
import type { Rendered } from "./templates";

export type TranscriptTurn = { role: string; text: string; time?: string | null };

export type InteractionNoticeInput = {
  /** Short label for the hero band, e.g. "Voice call transcript". */
  title: string;
  /** Subject line for the owner inbox. */
  subject: string;
  emoji?: string;
  /** Summary rows (who, when, channel, etc.). */
  rows?: Array<[string, string | number | null | undefined]>;
  /** Free-form body sent to the visitor, or a call summary. */
  body?: string | null;
  /** Full conversation transcript, in order. */
  transcript?: TranscriptTurn[];
};

function transcriptHtml(turns: TranscriptTurn[]) {
  const rows = turns
    .map((t) => {
      const agent = /agent|assistant|maggie|ai/i.test(t.role);
      const who = agent ? "Maggie" : "Visitor";
      const color = agent ? BRAND.primary : BRAND.ink;
      return `<tr><td style="padding:8px 0;border-bottom:1px solid ${BRAND.hairline};vertical-align:top;width:96px;color:${color};font-weight:700;font-size:13px">${esc(who)}${
        t.time ? `<br /><span style="color:${BRAND.muted};font-weight:400;font-size:11px">${esc(t.time)}</span>` : ""
      }</td><td style="padding:8px 0 8px 12px;border-bottom:1px solid ${BRAND.hairline};color:${BRAND.body};font-size:14px;line-height:1.55;white-space:pre-wrap">${esc(
        t.text,
      )}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 4px">${rows}</table>`;
}

/** Internal notification delivered to hello@magnoliamaids.pro for every visitor interaction. */
export function interactionNoticeEmail(i: InteractionNoticeInput): Rendered {
  const parts: string[] = [];
  if (i.rows?.length) parts.push(kvTable(i.rows));
  if (i.body && i.body.trim()) {
    parts.push(heading("Message"));
    parts.push(
      `<div style="background:${BRAND.softer};border:1px solid ${BRAND.hairline};border-radius:10px;padding:14px 16px;color:${BRAND.body};font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(
        i.body.trim(),
      )}</div>`,
    );
  }
  if (i.transcript?.length) {
    parts.push(heading("Full transcript"));
    parts.push(transcriptHtml(i.transcript));
  }
  if (!parts.length) parts.push(paragraph("No additional details were captured."));

  return {
    subject: i.subject,
    html: renderLayout(parts.join(""), {
      heroTitle: i.title,
      heroEmoji: i.emoji ?? "🔔",
      preview: i.subject,
      footerNote: "Internal notification — Magnolia Maids activity feed.",
    }),
  };
}
