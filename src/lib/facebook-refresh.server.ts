/**
 * Hourly Facebook refresh. Polls the Page for Lead Ads submissions and
 * Messenger activity that a webhook delivery may have missed, feeds anything
 * new through the same ingest paths (so dedupe still applies), and lets Maggie
 * pick up unanswered conversations.
 */
import { graphGet, userToken, ingestLeadgen } from "@/lib/facebook.server";
import { FACEBOOK_LEAD_FORMS, FACEBOOK_PAGE_ID } from "@/lib/facebook-config";

async function pageToken(pageId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("facebook_connections")
    .select("page_access_token")
    .eq("page_id", pageId)
    .maybeSingle();
  return data?.page_access_token ?? userToken();
}

export async function refreshLeadForms(sinceMs: number) {
  let imported = 0;
  let seen = 0;
  const errors: string[] = [];
  const token = await pageToken(FACEBOOK_PAGE_ID);
  const since = Math.floor(sinceMs / 1000);

  for (const [formId, form] of Object.entries(FACEBOOK_LEAD_FORMS)) {
    try {
      const res = await graphGet(`/${formId}/leads`, token, {
        fields: "id,created_time",
        limit: "50",
        filtering: JSON.stringify([
          { field: "time_created", operator: "GREATER_THAN", value: String(since) },
        ]),
      });
      for (const lead of res.data ?? []) {
        seen += 1;
        try {
          const out = await ingestLeadgen({
            leadgenId: String(lead.id),
            pageId: FACEBOOK_PAGE_ID,
            formName: form.label,
          });
          if (out.stored) imported += 1;
        } catch (e) {
          errors.push(`lead ${lead.id}: ${e instanceof Error ? e.message : "failed"}`);
        }
      }
    } catch (e) {
      errors.push(`form ${formId}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  return { seen, imported, errors };
}

export async function refreshMessenger(sinceMs: number, origin: string) {
  const { handleMessagingEvent } = await import("@/lib/messenger-agent.server");
  const token = await pageToken(FACEBOOK_PAGE_ID);
  const errors: string[] = [];
  let replayed = 0;

  let convos: any = { data: [] };
  try {
    convos = await graphGet(`/${FACEBOOK_PAGE_ID}/conversations`, token, {
      platform: "messenger",
      fields: "id,updated_time,participants,messages.limit(10){id,message,from,created_time}",
      limit: "25",
    });
  } catch (e) {
    return { replayed, errors: [`conversations: ${e instanceof Error ? e.message : "failed"}`] };
  }

  for (const convo of convos.data ?? []) {
    if (convo.updated_time && new Date(convo.updated_time).getTime() < sinceMs) continue;
    const messages = [...(convo.messages?.data ?? [])].reverse(); // oldest first
    for (const m of messages) {
      const at = new Date(m.created_time ?? Date.now()).getTime();
      if (at < sinceMs) continue;
      const fromId = String(m.from?.id ?? "");
      if (!fromId) continue;
      const fromPage = fromId === FACEBOOK_PAGE_ID;
      try {
        // recordMessage dedupes on the message id, so replaying is safe.
        await handleMessagingEvent(
          {
            sender: { id: fromPage ? FACEBOOK_PAGE_ID : fromId },
            recipient: { id: fromPage ? String(participantId(convo)) : FACEBOOK_PAGE_ID },
            timestamp: at,
            message: { mid: String(m.id), text: m.message ?? "", is_echo: fromPage },
          } as never,
          origin,
        );
        replayed += 1;
      } catch (e) {
        errors.push(`message ${m.id}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
  }
  return { replayed, errors };
}

function participantId(convo: any): string {
  const person = (convo.participants?.data ?? []).find(
    (p: any) => String(p.id) !== FACEBOOK_PAGE_ID,
  );
  return person ? String(person.id) : FACEBOOK_PAGE_ID;
}
