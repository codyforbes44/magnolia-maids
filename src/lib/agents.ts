/** Conversational agents this business runs. Kept separate so both the
 *  client-safe server functions and the sync job can import it. */
export const AGENTS = [
  { id: "agent_0001kygbk76rfwxrf6bef7z6xf1t", name: "Maggie (Concierge)" },
  { id: "agent_7301kygd9bvsf9wbdy5y0tmx62ky", name: "Marina" },
  { id: "agent_0801kygdnrpefymrd0hdh7549p4a", name: "Maya" },
] as const;

/** Dedicated agent that places outbound follow-up calls. Inbound chat/voice
 *  keeps using the concierge agents above. */
export const OUTBOUND_AGENT_ID = "agent_4101kzvs7n0cfcft8g96eg2c2s1e";
export const OUTBOUND_AGENTS = [
  { id: OUTBOUND_AGENT_ID, name: "Maggie (Outbound)" },
] as const;
