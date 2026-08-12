import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attributionSchema, attributionColumns } from "./attribution";
import { CONTACT_PREFS } from "./contact-pref";

const count = z.coerce.number().int().min(0).max(5000);

export const propertyInquirySchema = z.object({
  propertyName: z.string().trim().min(2, "Enter the property name").max(160),
  propertyAddress: z.string().trim().max(255).optional().or(z.literal("")),
  totalUnits: z.coerce.number().int().min(0).max(20000).optional(),
  unitsStudio: count.default(0),
  units1bd: count.default(0),
  units2bd: count.default(0),
  units3bdPlus: count.default(0),
  turnsPerMonth: z.string().trim().max(60).optional().or(z.literal("")),
  turnaround: z.string().trim().max(80).optional().or(z.literal("")),
  accessMethod: z.string().trim().max(120).optional().or(z.literal("")),
  needsTrashOut: z.boolean().default(false),
  needsCarpetCare: z.boolean().default(false),
  startDate: z.string().trim().max(20).optional().or(z.literal("")),
  contactName: z.string().trim().min(2, "Enter your name").max(120),
  contactRole: z.string().trim().max(120).optional().or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  contactPref: z.enum(CONTACT_PREFS).default("email"),
  attribution: attributionSchema.partial().optional(),
});

export type PropertyInquiryInput = z.input<typeof propertyInquirySchema>;

export const submitPropertyInquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => propertyInquirySchema.parse(data))
  .handler(async ({ data }) => {
    const { sendResendEmail, NOTIFY_EMAIL } = await import("./resend.server");
    const { propertyInquiryAdmin, propertyInquiryManager } = await import("./email/property-inquiry");
    const { saveContactSubmission } = await import("./returning-contact.server");

    const detail = {
      propertyName: data.propertyName,
      propertyAddress: data.propertyAddress || null,
      totalUnits: data.totalUnits ?? null,
      unitsStudio: data.unitsStudio,
      units1bd: data.units1bd,
      units2bd: data.units2bd,
      units3bdPlus: data.units3bdPlus,
      turnsPerMonth: data.turnsPerMonth || null,
      turnaround: data.turnaround || null,
      accessMethod: data.accessMethod || null,
      needsTrashOut: data.needsTrashOut,
      needsCarpetCare: data.needsCarpetCare,
      startDate: data.startDate || null,
      contactName: data.contactName,
      contactRole: data.contactRole || null,
      company: data.company || null,
      email: data.email,
      phone: data.phone || null,
      notes: data.notes || null,
    };

    const saved = await saveContactSubmission({
      table: "property_inquiries",
      email: detail.email,
      phone: detail.phone,
      appendColumn: "notes",
      source: "apartment turnovers form",
      summary: `${detail.propertyName}${detail.totalUnits ? ` · ${detail.totalUnits} units` : ""}`,
      values: {
      property_name: detail.propertyName,
      property_address: detail.propertyAddress,
      total_units: detail.totalUnits,
      units_studio: detail.unitsStudio,
      units_1bd: detail.units1bd,
      units_2bd: detail.units2bd,
      units_3bd_plus: detail.units3bdPlus,
      turns_per_month: detail.turnsPerMonth,
      turnaround: detail.turnaround,
      access_method: detail.accessMethod,
      needs_trash_out: detail.needsTrashOut,
      needs_carpet_care: detail.needsCarpetCare,
      start_date: /^\d{4}-\d{2}-\d{2}$/.test(data.startDate || "") ? data.startDate : null,
      contact_name: detail.contactName,
      contact_role: detail.contactRole,
      company: detail.company,
      email: detail.email,
      phone: detail.phone,
      notes: detail.notes,
      contact_pref: data.contactPref,
      ...attributionColumns(data.attribution as never),
      },
    });

    const admin = propertyInquiryAdmin(detail);
    const notified = await sendResendEmail({
      to: NOTIFY_EMAIL,
      subject: admin.subject,
      html: admin.html,
      reply_to: data.email,
      kind: "property-inquiry",
      templateId: "property-inquiry-admin",
    });
    if (!notified.sent) console.error("[property-inquiry] admin notification failed", notified.reason);

    const manager = propertyInquiryManager(detail);
    await sendResendEmail({
      to: data.email,
      subject: manager.subject,
      html: manager.html,
      kind: "property-inquiry",
      templateId: "property-inquiry-manager",
    });

    return { ok: true as const, id: saved.id, returning: saved.returning, submissions: saved.submissions };
  });
