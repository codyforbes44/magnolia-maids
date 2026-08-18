import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  HubOverview,
  HubThread,
  HubMessage,
  HubReminder,
  HubCall,
  HubSearchResult,
  HubSearchKind,
} from "./hub-types";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

/** Everything the phone home screen needs in a single round trip. */
export const getHubOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HubOverview> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekOut = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
    const dayAgo = new Date(now.getTime() - 86400000).toISOString();

    const [threads, bookings, calls, msgrThreads, emails, reminderRows, profile] =
      await Promise.all([
        supabaseAdmin
          .from("message_threads")
          .select("id, channel, unread, contact_name, contact_key, last_snippet, last_message_at, last_direction")
          .order("last_message_at", { ascending: false })
          .limit(200),
        supabaseAdmin
          .from("booking_requests")
          .select("id, name, phone, address, service, frequency, preferred_day, preferred_time, status")
          .gte("preferred_day", today)
          .lte("preferred_day", weekOut)
          .order("preferred_day", { ascending: true })
          .limit(25),
        supabaseAdmin
          .from("outbound_calls")
          .select("id, contact_name, phone_e164, purpose, status, outcome, duration_secs, created_at, last_attempt_at")
          .order("created_at", { ascending: false })
          .limit(25),
        supabaseAdmin
          .from("messenger_threads")
          .select("thread_id, person_name, snippet, needs_attention, updated_at")
          .order("updated_at", { ascending: false })
          .limit(25),
        supabaseAdmin
          .from("email_log")
          .select("id, recipient, subject, status, created_at")
          .not("kind", "like", "sms%")
          .gte("created_at", dayAgo)
          .order("created_at", { ascending: false })
          .limit(100),
        supabaseAdmin
          .from("admin_reminders")
          .select("id, title, note, channel, due_at, snooze_until, link, done_at")
          .eq("user_id", context.userId)
          .is("done_at", null)
          .order("due_at", { ascending: true, nullsFirst: false })
          .limit(50),
        supabaseAdmin
          .from("customer_profiles")
          .select("full_name")
          .eq("id", context.userId)
          .maybeSingle(),
      ]);

    const threadRows = threads.data ?? [];
    const unreadByChannel: Record<string, number> = {};
    for (const t of threadRows) {
      unreadByChannel[t.channel] = (unreadByChannel[t.channel] ?? 0) + (t.unread ?? 0);
    }
    const attention = (msgrThreads.data ?? []).filter((t) => t.needs_attention).length;
    if (attention) unreadByChannel["messenger"] = attention;

    const missedCalls = (calls.data ?? []).filter((c) =>
      ["failed", "no-answer", "busy"].includes(String(c.status)),
    );
    const failedEmails = (emails.data ?? []).filter((e) => e.status !== "sent");

    // Auto-generated reminders, derived from the data itself.
    const auto: HubReminder[] = [];
    for (const t of threadRows) {
      if ((t.unread ?? 0) > 0 && t.last_direction === "in") {
        auto.push({
          id: `auto-thread-${t.id}`,
          title: `Reply to ${t.contact_name || t.contact_key}`,
          note: t.last_snippet,
          channel: t.channel,
          dueAt: t.last_message_at,
          snoozeUntil: null,
          link: null,
          done: false,
          auto: true,
        });
      }
    }
    for (const c of missedCalls.slice(0, 5)) {
      auto.push({
        id: `auto-call-${c.id}`,
        title: `Call back ${c.contact_name}`,
        note: `${c.purpose} · ${c.status}`,
        channel: "call",
        dueAt: c.last_attempt_at ?? c.created_at,
        snoozeUntil: null,
        link: null,
        done: false,
        auto: true,
      });
    }
    for (const m of (msgrThreads.data ?? []).filter((t) => t.needs_attention).slice(0, 5)) {
      auto.push({
        id: `auto-msgr-${m.thread_id}`,
        title: `Messenger needs you — ${m.person_name}`,
        note: m.snippet,
        channel: "messenger",
        dueAt: m.updated_at,
        snoozeUntil: null,
        link: null,
        done: false,
        auto: true,
      });
    }
    for (const b of (bookings.data ?? []).filter((b) => b.preferred_day === today)) {
      auto.push({
        id: `auto-booking-${b.id}`,
        title: `Job today — ${b.name}`,
        note: `${b.service} · ${b.preferred_time ?? "time TBD"}`,
        channel: "booking",
        dueAt: null,
        snoozeUntil: null,
        link: "/admin/bookings",
        done: false,
        auto: true,
      });
    }
    if (failedEmails.length) {
      auto.push({
        id: "auto-email-failures",
        title: `${failedEmails.length} email${failedEmails.length === 1 ? "" : "s"} failed to send`,
        note: failedEmails[0]?.subject ?? null,
        channel: "email",
        dueAt: null,
        snoozeUntil: null,
        link: "/admin/email-log",
        done: false,
        auto: true,
      });
    }

    const personal: HubReminder[] = (reminderRows.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      note: r.note,
      channel: r.channel,
      dueAt: r.due_at,
      snoozeUntil: r.snooze_until,
      link: r.link,
      done: !!r.done_at,
      auto: false,
    }));

    return {
      name: profile.data?.full_name ?? null,
      unreadByChannel,
      totalUnread: Object.values(unreadByChannel).reduce((a, b) => a + b, 0),
      missedCalls: missedCalls.length,
      reminders: [...personal, ...auto].filter(
        (r) => !r.snoozeUntil || new Date(r.snoozeUntil) <= now,
      ),
      bookings: (bookings.data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        phone: b.phone,
        address: b.address,
        service: b.service,
        frequency: b.frequency,
        day: b.preferred_day,
        time: b.preferred_time,
        status: b.status,
      })),
      calls: (calls.data ?? []).slice(0, 12).map(
        (c): HubCall => ({
          id: c.id,
          name: c.contact_name,
          phone: c.phone_e164,
          purpose: c.purpose,
          status: c.status,
          outcome: c.outcome,
          durationSecs: c.duration_secs,
          at: c.last_attempt_at ?? c.created_at,
        }),
      ),
    };
  });

const threadListInput = z.object({
  channel: z.enum(["sms", "email", "chat", "messenger", "slack", "call", "all"]).default("all"),
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(200).default(60),
});

export const listHubThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => threadListInput.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<{ threads: HubThread[] }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("message_threads")
      .select("id, channel, contact_key, contact_name, phone, email, last_snippet, last_direction, last_message_at, unread")
      .order("last_message_at", { ascending: false })
      .limit(data.limit);
    if (data.channel !== "all") query = query.eq("channel", data.channel);
    if (data.search) {
      const s = data.search.replace(/[%,]/g, " ");
      query = query.or(`contact_key.ilike.%${s}%,contact_name.ilike.%${s}%,last_snippet.ilike.%${s}%`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const threads: HubThread[] = (rows ?? []).map((r) => ({
      id: r.id,
      channel: r.channel,
      contactKey: r.contact_key,
      contactName: r.contact_name,
      phone: r.phone,
      email: r.email,
      snippet: r.last_snippet,
      lastDirection: r.last_direction,
      lastMessageAt: r.last_message_at,
      unread: r.unread ?? 0,
      consent: null,
    }));

    // Attach SMS consent so the composer can warn before texting.
    const phones = threads.filter((t) => t.channel === "sms").map((t) => t.contactKey);
    if (phones.length) {
      const { data: consents } = await supabaseAdmin
        .from("sms_consents")
        .select("phone, consent")
        .in("phone", phones);
      const map = new Map((consents ?? []).map((c) => [c.phone, c.consent]));
      for (const t of threads) {
        if (t.channel !== "sms") continue;
        const v = map.get(t.contactKey);
        t.consent = v === undefined ? "unknown" : v ? "opted_in" : "opted_out";
      }
    }

    return { threads };
  });

export const getHubThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ threadId: z.string().uuid(), markRead: z.boolean().default(true) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ messages: HubMessage[] }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("messages")
      .select("id, direction, channel, body, subject, status, error, author, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true })
      .limit(300);
    if (error) throw new Error(error.message);
    if (data.markRead) {
      await supabaseAdmin.from("message_threads").update({ unread: 0 }).eq("id", data.threadId);
    }
    return {
      messages: (rows ?? []).map((m) => ({
        id: m.id,
        direction: m.direction as "in" | "out",
        channel: m.channel,
        body: m.body,
        subject: m.subject,
        status: m.status,
        error: m.error,
        author: m.author,
        at: m.created_at,
      })),
    };
  });

export const sendHubText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        to: z.string().trim().min(7).max(30),
        body: z.string().trim().min(1).max(1200),
        allowUnknown: z.boolean().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { sendSms } = await import("@/lib/sms.server");
    return sendSms({
      to: data.to,
      body: data.body,
      kind: "sms-hub",
      allowUnknown: data.allowUnknown,
    });
  });

export const listHubReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ includeDone: z.boolean().default(false) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ reminders: HubReminder[] }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("admin_reminders")
      .select("id, title, note, channel, due_at, snooze_until, link, done_at")
      .eq("user_id", context.userId)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(100);
    if (!data.includeDone) q = q.is("done_at", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return {
      reminders: (rows ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        note: r.note,
        channel: r.channel,
        dueAt: r.due_at,
        snoozeUntil: r.snooze_until,
        link: r.link,
        done: !!r.done_at,
        auto: false,
      })),
    };
  });

export const createHubReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().trim().min(1).max(160),
        note: z.string().trim().max(600).optional(),
        channel: z.string().trim().max(30).optional(),
        dueAt: z.string().trim().max(40).optional(),
        link: z.string().trim().max(300).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_reminders").insert({
      user_id: context.userId,
      title: data.title,
      note: data.note ?? null,
      channel: data.channel ?? null,
      due_at: data.dueAt ? new Date(data.dueAt).toISOString() : null,
      link: data.link ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateHubReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["done", "reopen", "snooze", "delete"]),
        snoozeMinutes: z.number().int().min(5).max(10080).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "delete") {
      await supabaseAdmin
        .from("admin_reminders")
        .delete()
        .eq("id", data.id)
        .eq("user_id", context.userId);
      return { ok: true };
    }
    const patch =
      data.action === "done"
        ? { done_at: new Date().toISOString() }
        : data.action === "reopen"
          ? { done_at: null }
          : {
              snooze_until: new Date(
                Date.now() + (data.snoozeMinutes ?? 60) * 60000,
              ).toISOString(),
            };
    const { error } = await supabaseAdmin
      .from("admin_reminders")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Global hub search across conversations, calls and lead records. */
export const searchHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        q: z.string().trim().min(2).max(120),
        kinds: z.array(z.string()).default([]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ results: HubSearchResult[] }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = data.q.replace(/[%,()]/g, " ").trim();
    const like = `%${s}%`;
    const digits = s.replace(/\D/g, "");
    const want = (k: HubSearchKind) => data.kinds.length === 0 || data.kinds.includes(k);

    const [threads, msgs, calls, leads, bookings, applicants] = await Promise.all([
      supabaseAdmin
        .from("message_threads")
        .select("id, channel, contact_key, contact_name, last_snippet, last_message_at")
        .or(`contact_key.ilike.${like},contact_name.ilike.${like},last_snippet.ilike.${like}`)
        .order("last_message_at", { ascending: false })
        .limit(40),
      supabaseAdmin
        .from("messages")
        .select("id, thread_id, channel, body, subject, created_at")
        .or(`body.ilike.${like},subject.ilike.${like}`)
        .order("created_at", { ascending: false })
        .limit(40),
      supabaseAdmin
        .from("outbound_calls")
        .select("id, contact_name, phone_e164, purpose, status, outcome, created_at, last_attempt_at")
        .or(
          `contact_name.ilike.${like},phone_e164.ilike.${like}${digits.length >= 4 ? `,phone_e164.ilike.%${digits}%` : ""}`,
        )
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("campaign_leads")
        .select("id, name, email, phone, campaign, message, status, created_at")
        .or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like},message.ilike.${like}`)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("booking_requests")
        .select("id, name, email, phone, service, address, status, created_at")
        .or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like},address.ilike.${like}`)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("job_applications")
        .select("id, name, email, phone, role, status, created_at")
        .or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const threadRows = threads.data ?? [];
    const threadById = new Map(threadRows.map((t) => [t.id, t]));
    const results: HubSearchResult[] = [];
    const seen = new Set<string>();

    const kindOf = (channel: string): HubSearchKind =>
      (["sms", "chat", "email", "messenger", "slack", "call"].includes(channel)
        ? channel === "call"
          ? "call"
          : (channel as HubSearchKind)
        : "chat");

    for (const t of threadRows) {
      const kind = kindOf(t.channel);
      if (!want(kind)) continue;
      seen.add(t.id);
      results.push({
        id: `thread-${t.id}`,
        kind,
        title: t.contact_name || t.contact_key,
        subtitle: t.contact_name ? t.contact_key : null,
        snippet: t.last_snippet,
        at: t.last_message_at,
        threadId: t.id,
        contactKey: t.contact_key,
        link: null,
      });
    }

    const missing = [...new Set((msgs.data ?? []).map((m) => m.thread_id))].filter(
      (id) => !threadById.has(id),
    );
    if (missing.length) {
      const { data: extra } = await supabaseAdmin
        .from("message_threads")
        .select("id, channel, contact_key, contact_name, last_message_at")
        .in("id", missing);
      for (const t of extra ?? []) threadById.set(t.id, t as never);
    }

    for (const m of msgs.data ?? []) {
      const t = threadById.get(m.thread_id);
      const kind = kindOf(m.channel || t?.channel || "chat");
      if (!want(kind) || (t && seen.has(t.id))) continue;
      results.push({
        id: `msg-${m.id}`,
        kind,
        title: t?.contact_name || t?.contact_key || m.subject || "Message",
        subtitle: m.subject && m.channel === "email" ? m.subject : (t?.contact_key ?? null),
        snippet: m.body?.slice(0, 160) ?? null,
        at: m.created_at,
        threadId: m.thread_id,
        contactKey: t?.contact_key ?? null,
        link: null,
      });
    }

    if (want("call")) {
      for (const c of calls.data ?? []) {
        results.push({
          id: `call-${c.id}`,
          kind: "call",
          title: c.contact_name || c.phone_e164,
          subtitle: c.phone_e164,
          snippet: `${c.purpose} · ${c.outcome ?? c.status}`,
          at: c.last_attempt_at ?? c.created_at,
          threadId: null,
          contactKey: c.phone_e164,
          link: "/admin/calls",
        });
      }
    }

    if (want("lead")) {
      for (const l of leads.data ?? []) {
        results.push({
          id: `lead-${l.id}`,
          kind: "lead",
          title: l.name,
          subtitle: [l.email, l.phone].filter(Boolean).join(" · ") || null,
          snippet: `Lead · ${l.campaign ?? "web"} · ${l.status}`,
          at: l.created_at,
          threadId: null,
          contactKey: l.phone || l.email || null,
          link: "/admin/leads",
        });
      }
      for (const b of bookings.data ?? []) {
        results.push({
          id: `booking-${b.id}`,
          kind: "lead",
          title: b.name,
          subtitle: [b.email, b.phone].filter(Boolean).join(" · ") || null,
          snippet: `Booking · ${b.service} · ${b.status}`,
          at: b.created_at,
          threadId: null,
          contactKey: b.phone || b.email || null,
          link: "/admin/bookings",
        });
      }
      for (const a of applicants.data ?? []) {
        results.push({
          id: `applicant-${a.id}`,
          kind: "lead",
          title: a.name,
          subtitle: [a.email, a.phone].filter(Boolean).join(" · ") || null,
          snippet: `Applicant · ${a.role} · ${a.status}`,
          at: a.created_at,
          threadId: null,
          contactKey: a.phone || a.email || null,
          link: "/admin/applications",
        });
      }
    }

    results.sort((x, y) => (y.at ?? "").localeCompare(x.at ?? ""));
    return { results: results.slice(0, 80) };
  });
