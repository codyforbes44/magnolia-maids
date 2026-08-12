import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attributionSchema, attributionColumns } from "./attribution";
import { CONTACT_PREFS } from "./contact-pref";

export const franchiseInquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  targetCity: z.string().trim().max(120).optional().or(z.literal("")),
  targetState: z.string().trim().max(60).optional().or(z.literal("")),
  timeline: z.string().trim().max(80).optional().or(z.literal("")),
  capitalBand: z.string().trim().max(80).optional().or(z.literal("")),
  background: z.string().trim().max(2000).optional().or(z.literal("")),
  why: z.string().trim().max(2000).optional().or(z.literal("")),
  contactPref: z.enum(CONTACT_PREFS).default("email"),
  attribution: attributionSchema.partial().optional(),
});

export type FranchiseInquiryInput = z.input<typeof franchiseInquirySchema>;

export const submitFranchiseInquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => franchiseInquirySchema.parse(data))
  .handler(async ({ data }) => {
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { franchiseInquiryAdmin, franchiseInquiryCandidate } = await import("./email/franchise");
    const { saveContactSubmission } = await import("./returning-contact.server");

    const detail = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      targetCity: data.targetCity || null,
      targetState: data.targetState || null,
      timeline: data.timeline || null,
      capitalBand: data.capitalBand || null,
      background: data.background || null,
      why: data.why || null,
    };

    const market = [detail.targetCity, detail.targetState].filter(Boolean).join(", ");

    const saved = await saveContactSubmission({
      table: "franchise_inquiries" as never,
      email: detail.email,
      phone: detail.phone,
      appendColumn: "notes",
      source: "franchise interest form",
      summary: market ? `Franchise interest · ${market}` : "Franchise interest",
      values: {
        name: detail.name,
        email: detail.email,
        phone: detail.phone,
        target_city: detail.targetCity,
        target_state: detail.targetState,
        timeline: detail.timeline,
        capital_band: detail.capitalBand,
        background: detail.background,
        why: detail.why,
        notes: null,
        contact_pref: data.contactPref,
        source: "franchise-page",
        ...attributionColumns(data.attribution as never),
      },
    });

    const admin = franchiseInquiryAdmin(detail);
    const notified = await sendResendEmail({
      to: NOTIFY_EMAIL,
      subject: admin.subject,
      html: admin.html,
      reply_to: data.email,
      kind: "franchise-inquiry",
      templateId: "franchise-inquiry-admin",
    });
    if (!notified.sent) console.error("[franchise] admin notification failed", notified.reason);

    const candidate = franchiseInquiryCandidate(detail);
    await sendResendEmail({
      to: data.email,
      subject: candidate.subject,
      html: candidate.html,
      kind: "franchise-inquiry",
      templateId: "franchise-inquiry-candidate",
    });

    return { ok: true as const, id: saved.id, returning: saved.returning };
  });
