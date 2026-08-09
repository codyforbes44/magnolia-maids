/**
 * Daily content sync.
 *
 * 1. Rebuilds Maggie's ElevenLabs knowledge base from the live app data
 *    (pricing, services, campaigns, FAQs, service areas, community page) and
 *    re-attaches the fresh document to every agent.
 * 2. Sweeps every public page to make sure it still renders its key content.
 * 3. Logs the run and emails the office when anything is off.
 *
 * Shared by the cron hook and the admin "Sync now" button.
 */
import { buildAgentKnowledge, BUSINESS, PAGES } from "@/agents/knowledge";
import { AGENTS } from "@/lib/agents";
import { faqGroups } from "@/lib/faq";
import { SERVICE_AREA_PAGES } from "@/lib/service-areas";
import { ATTRACTIONS, SEASON_TIPS } from "@/lib/community";
import { ADDONS } from "@/lib/pricing";

const API = "https://api.elevenlabs.io/v1";
const KB_NAME = "Magnolia Maids Knowledge Base (auto-sync)";

export type PageFailure = { path: string; reason: string };

export type SyncResult = {
  status: "ok" | "degraded" | "failed";
  trigger: string;
  kb_document_id: string | null;
  kb_bytes: number;
  agents_updated: number;
  agents_total: number;
  pages_checked: number;
  page_failures: PageFailure[];
  notes: string | null;
  duration_ms: number;
};

/* ------------------------------------------------------------------ */
/* Knowledge document                                                  */
/* ------------------------------------------------------------------ */

/** The complete, always-current document handed to the voice/chat agents. */
export function buildKnowledgeDocument(): string {
  const faq = faqGroups
    .map(
      (g) =>
        `#### ${g.label}\n${g.items.map((i) => `- Q: ${i.q}\n  A: ${i.a}`).join("\n")}`,
    )
    .join("\n\n");

  const areas = SERVICE_AREA_PAGES.map(
    (a) =>
      `- ${a.name} (${BUSINESS.site}/service-areas/${a.slug}) — ${a.intro}`,
  ).join("\n");

  const community = [
    "Local attractions we can talk about:",
    ...ATTRACTIONS.map((a) => `- ${a.name} — ${a.blurb}`),
    "",
    "Seasonal tips currently published:",
    ...SEASON_TIPS.map((t) => `- ${t.headline}: ${t.body}`),
    "",
    `Live Durant weather and the full local guide are at ${BUSINESS.site}/community (updated daily).`,
  ].join("\n");

  const addons = ADDONS.map((a) => `- ${a.label}: +$${a.price}`).join("\n");

  return `# Magnolia Maids — Knowledge Base
_Auto-generated from the live website on ${new Date().toISOString()}. Always the newest version wins._

${buildAgentKnowledge()}

### Add-ons (added on top of the service total)
${addons}

### Service-area pages
${areas}

### Community & local guide
${community}

### Frequently asked questions (verbatim from ${BUSINESS.site}/faq)
${faq}

### Every public page on the site
${PAGES.map((p) => `- ${BUSINESS.site}${p.path === "/" ? "" : p.path} — ${p.what}`).join("\n")}
`;
}

/* ------------------------------------------------------------------ */
/* ElevenLabs                                                          */
/* ------------------------------------------------------------------ */

function key() {
  const k = process.env["ELEVENLABS_API_KEY"];
  if (!k) throw new Error("ELEVENLABS_API_KEY is not set");
  return k;
}

async function eleven(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "xi-api-key": key(), "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${res.status} ${path}: ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) : {};
}

/** Uploads the current document and points every agent at it. */
async function syncKnowledgeBase(notes: string[]) {
  const text = buildKnowledgeDocument();
  const stamp = new Date().toISOString().slice(0, 10);

  const created = await eleven("/convai/knowledge-base/text", {
    method: "POST",
    body: JSON.stringify({ name: `${KB_NAME} ${stamp}`, text }),
  });
  const docId: string = created.id ?? created.document_id;
  if (!docId) throw new Error("ElevenLabs did not return a knowledge base document id");

  let updated = 0;
  const staleIds = new Set<string>();

  for (const agent of AGENTS) {
    try {
      const current = await eleven(`/convai/agents/${agent.id}`);
      const prompt = current?.conversation_config?.agent?.prompt ?? {};
      const existing: any[] = Array.isArray(prompt.knowledge_base) ? prompt.knowledge_base : [];
      for (const d of existing) {
        if (typeof d?.name === "string" && d.name.startsWith(KB_NAME) && d.id !== docId) {
          staleIds.add(d.id);
        }
      }
      const kept = existing.filter(
        (d) => !(typeof d?.name === "string" && d.name.startsWith(KB_NAME)),
      );
      await eleven(`/convai/agents/${agent.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          conversation_config: {
            agent: {
              // Send only the knowledge_base field: echoing the whole prompt back
              // trips ElevenLabs' "both tools and tool IDs" validation.
              prompt: {
                knowledge_base: [
                  ...kept,
                  { type: "text", name: `${KB_NAME} ${stamp}`, id: docId, usage_mode: "auto" },
                ],
              },
            },
          },
        }),
      });
      updated += 1;
    } catch (e) {
      notes.push(`${agent.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Only remove yesterday's documents once every agent points at the new one.
  if (updated === AGENTS.length) {
    for (const id of staleIds) {
      try {
        await eleven(`/convai/knowledge-base/${id}`, { method: "DELETE" });
      } catch {
        /* a doc still referenced elsewhere is harmless */
      }
    }
  }

  return { docId, updated, bytes: text.length };
}

/* ------------------------------------------------------------------ */
/* Page sweep                                                          */
/* ------------------------------------------------------------------ */

/** Public pages plus a phrase that proves the page rendered its real content. */
const PAGE_CHECKS: { path: string; expect: string }[] = [
  { path: "/", expect: "Magnolia Maids" },
  { path: "/services", expect: "Standard Clean" },
  { path: "/pricing", expect: "Deep Clean" },
  { path: "/booking", expect: "bedrooms" },
  { path: "/quote", expect: "INSTANT QUOTE" },
  { path: "/faq", expect: faqGroups[0]?.items[0]?.q ?? "questions" },
  { path: "/community", expect: "Durant weather" },
  { path: "/airbnb-turnover", expect: "turnover" },
  { path: "/post-event-cleaning", expect: "event" },
  { path: "/move-out-cleaning", expect: "Move" },
  { path: "/apartment-turnovers", expect: "units" },
  { path: "/about", expect: "Durant" },
  { path: "/about/careers", expect: "mileage" },
  { path: "/franchise", expect: "franchise" },
  { path: "/service-areas", expect: "Bryan County" },
  ...SERVICE_AREA_PAGES.map((a) => ({ path: `/service-areas/${a.slug}`, expect: a.name })),
  { path: "/privacy", expect: "Privacy" },
  { path: "/terms", expect: "Terms" },
  { path: "/cookies", expect: "Cookie" },
  { path: "/sitemap.xml", expect: "<urlset" },
];

/** Loose HTML match — entities and casing shouldn't fail a real render. */
function rendered(html: string, needle: string) {
  const norm = (s: string) =>
    s
      .replace(/&#x27;|&#39;|&rsquo;|’/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .toLowerCase();
  return norm(html).includes(norm(needle));
}

async function sweepPages(origin: string) {
  const failures: PageFailure[] = [];
  const batch = 5;
  for (let i = 0; i < PAGE_CHECKS.length; i += batch) {
    const slice = PAGE_CHECKS.slice(i, i + batch);
    const results = await Promise.all(
      slice.map(async (p) => {
        try {
          const res = await fetch(`${origin}${p.path}`, {
            headers: { "User-Agent": "MagnoliaMaids-ContentSync/1.0" },
          });
          if (!res.ok) return { path: p.path, reason: `HTTP ${res.status}` };
          const html = await res.text();
          if (!rendered(html, p.expect)) {
            return { path: p.path, reason: `missing "${p.expect}"` };
          }
          return null;
        } catch (e) {
          return { path: p.path, reason: e instanceof Error ? e.message : String(e) };
        }
      }),
    );
    for (const r of results) if (r) failures.push(r);
  }
  return failures;
}

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

export async function runContentSync(
  origin: string,
  trigger: "cron" | "manual" = "cron",
): Promise<SyncResult> {
  const startedAt = Date.now();
  const notes: string[] = [];

  let docId: string | null = null;
  let agentsUpdated = 0;
  let bytes = 0;
  try {
    const kb = await syncKnowledgeBase(notes);
    docId = kb.docId;
    agentsUpdated = kb.updated;
    bytes = kb.bytes;
  } catch (e) {
    notes.push(`Knowledge base sync failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  const pageFailures = await sweepPages(origin);
  if (pageFailures.length) {
    notes.push(`${pageFailures.length} page check(s) failed.`);
  }

  const kbOk = docId !== null && agentsUpdated === AGENTS.length;
  const status: SyncResult["status"] =
    !kbOk && pageFailures.length ? "failed" : kbOk && !pageFailures.length ? "ok" : "degraded";

  const row: SyncResult = {
    status,
    trigger,
    kb_document_id: docId,
    kb_bytes: bytes,
    agents_updated: agentsUpdated,
    agents_total: AGENTS.length,
    pages_checked: PAGE_CHECKS.length,
    page_failures: pageFailures,
    notes: notes.length ? notes.join(" ") : null,
    duration_ms: Date.now() - startedAt,
  };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("content_sync_runs").insert(row);
  if (error) console.error("[content-sync] log insert failed", error);
  await supabaseAdmin
    .from("content_sync_runs")
    .delete()
    .lt("created_at", new Date(Date.now() - 90 * 86400000).toISOString());

  if (status !== "ok" && trigger === "cron") {
    try {
      const { sendResendEmail, NOTIFY_EMAIL } = await import("@/lib/resend.server");
      await sendResendEmail({
        to: NOTIFY_EMAIL,
        subject: `Daily content sync: ${status}`,
        kind: "content-sync",
        html: `<p>The daily content sync came back <strong>${status}</strong>.</p>
<p>Knowledge base: ${docId ? `updated (${agentsUpdated}/${AGENTS.length} agents)` : "not updated"}.</p>
${notes.length ? `<ul>${notes.map((n) => `<li>${n}</li>`).join("")}</ul>` : ""}
${pageFailures.length ? `<p>Pages needing attention:</p><ul>${pageFailures.map((f) => `<li>${f.path} — ${f.reason}</li>`).join("")}</ul>` : ""}`,
      });
    } catch (e) {
      console.error("[content-sync] alert email failed", e);
    }
  }

  console.log(`[content-sync] (${trigger})`, status, row.notes ?? "all clear");
  return row;
}
