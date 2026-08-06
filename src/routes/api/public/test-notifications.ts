import { createFileRoute } from "@tanstack/react-router";
import { sendResendEmail } from "@/lib/resend.server";
import { sendSms } from "@/lib/sms.server";
import { bookingConfirmationSms, bookingAlertSms } from "@/lib/sms/messages";
import {
  bookingConfirmationCustomer,
  bookingNotificationAdmin,
  bookingStatusUpdate,
  airbnbTurnoverConfirmation,
  airbnbTurnoverStatus,
  careersApplicationCandidate,
  careersApplicationAdmin,
  quoteFollowup,
  reviewRequest,
  referralThanks,
  welcomePostFirstClean,
  passwordResetNotice,
  contactAcknowledgement,
  type BookingDetails,
  type Rendered,
} from "@/lib/email/templates";
import { campaignLeadCustomer, campaignLeadAdmin, type CampaignLead } from "@/lib/email/campaign";
import { holdReminder } from "@/lib/email/reminder";

const booking: BookingDetails = {
  id: "11111111-2222-3333-4444-555555555555",
  name: "Cody Forbes",
  email: "codyforbes@gmail.com",
  phone: "(580) 760-6391",
  address: "1200 W Main St, Durant, OK 74701",
  bedrooms: "3",
  bathrooms: "2",
  service: "Bright Clean",
  frequency: "Every 2 weeks",
  preferredDay: "2026-09-03",
  preferredTime: "Morning (8–11am)",
  notes: "Two friendly dogs. Gate code 1984.",
  estimate: "$179–$209",
};

const lead: CampaignLead = {
  id: "66666666-7777-8888-9999-000000000000",
  campaign: "summer-on-the-lake",
  campaignLabel: "Summer on the Lake",
  offer: "10% off your first lake-house reset",
  path: "/summer-on-the-lake",
  name: "Cody Forbes",
  email: "codyforbes@gmail.com",
  phone: "(580) 760-6391",
  homeSize: "3 bed · 2 bath",
  preferredDate: "2026-09-05",
  referralName: "Jane Neighbor",
  message: "Lake Texoma cabin, guests leave Sunday.",
};

export const Route = createFileRoute("/api/public/test-notifications")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-test-token");
        if (!token || token !== process.env['LOVABLE_API_KEY']) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { email, sms } = (await request.json()) as { email: string; sms: string };

        const templates: Array<[string, Rendered]> = [
          ["booking-confirmation", bookingConfirmationCustomer(booking)],
          ["booking-alert", bookingNotificationAdmin(booking)],
          ["booking-status-confirmed", bookingStatusUpdate(booking, "confirmed")],
          ["booking-status-en-route", bookingStatusUpdate(booking, "en_route")],
          ["booking-status-completed", bookingStatusUpdate(booking, "completed")],
          ["booking-status-cancelled", bookingStatusUpdate(booking, "cancelled")],
          ["airbnb-confirmation", airbnbTurnoverConfirmation({ ...booking, service: "Airbnb Turnover" }, "11:00am")],
          ["airbnb-status", airbnbTurnoverStatus({ ...booking, service: "Airbnb Turnover" }, "linens_swapped")],
          ["careers-candidate", careersApplicationCandidate({
            id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            name: "Cody Forbes", email, phone: "(580) 760-6391",
            area: "Durant", role: "House Cleaner", availability: "Weekdays 8–4",
            experience: "3 years", notes: "Has own car.",
          })],
          ["careers-admin", careersApplicationAdmin({
            id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            name: "Cody Forbes", email, phone: "(580) 760-6391",
            area: "Durant", role: "House Cleaner", availability: "Weekdays 8–4",
            experience: "3 years", notes: "Has own car.",
          })],
          ["campaign-thankyou", campaignLeadCustomer(lead)],
          ["campaign-admin", campaignLeadAdmin(lead)],
          ["hold-reminder", holdReminder({
            id: lead.id, campaign: lead.campaign, campaignLabel: lead.campaignLabel,
            name: lead.name, email, phone: lead.phone, holdDate: "2026-09-05",
            placeholder: false,
            details: [["Campaign", lead.campaignLabel], ["Home size", lead.homeSize], ["Target date", "2026-09-05"]],
          })],
          ["quote-followup", quoteFollowup("Cody", "Bright Clean")],
          ["review-request", reviewRequest("Cody", "Marisol")],
          ["referral-thanks", referralThanks("Cody", "Jane Neighbor")],
          ["welcome-first-clean", welcomePostFirstClean("Cody")],
          ["password-reset", passwordResetNotice("Cody", "https://magnoliamaids.pro/auth?reset=demo")],
          ["contact-ack", contactAcknowledgement("Cody", "Do you clean lake houses in Kingston?")],
        ];

        const emails: Array<{ kind: string; sent: boolean; reason?: string }> = [];
        for (const [kind, r] of templates) {
          try {
            const res = await sendResendEmail({
              to: email,
              subject: `[TEST] ${r.subject}`,
              html: r.html,
              kind: `test-${kind}`,
            });
            emails.push({ kind, sent: res.sent, reason: (res as { reason?: string }).reason });
          } catch (e) {
            emails.push({ kind, sent: false, reason: String(e) });
          }
          await new Promise((r) => setTimeout(r, 600));
        }

        const smsDetails = {
          id: booking.id, name: booking.name, service: booking.service,
          frequency: booking.frequency, bedrooms: booking.bedrooms,
          bathrooms: booking.bathrooms, preferredDay: booking.preferredDay,
          preferredTime: booking.preferredTime, estimate: booking.estimate,
        };
        const ok = emails.filter((e) => e.sent).length;
        const texts: Array<[string, string]> = [
          ["sms-test-booking-confirmation", `[TEST] ${bookingConfirmationSms(smsDetails)}`],
          ["sms-test-booking-alert", `[TEST] ${bookingAlertSms({ ...smsDetails, phone: booking.phone })}`],
          ["sms-test-summary", `[TEST] Magnolia Maids notification check: ${ok}/${emails.length} email templates delivered to ${email}. Reply STOP to opt out.`],
        ];
        const smsResults: Array<{ kind: string; sent: boolean; reason?: string }> = [];
        for (const [kind, body] of texts) {
          const res = await sendSms({ to: sms, body, kind });
          smsResults.push({ kind, sent: res.sent, reason: (res as { reason?: string }).reason });
          await new Promise((r) => setTimeout(r, 800));
        }

        return Response.json({ emails, sms: smsResults });
      },
    },
  },
});
