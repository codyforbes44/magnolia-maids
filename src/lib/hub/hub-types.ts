/** Shared shapes for the Magnolia Maids communications hub. */
export type HubReminder = {
  id: string;
  title: string;
  note: string | null;
  channel: string | null;
  dueAt: string | null;
  snoozeUntil: string | null;
  link: string | null;
  done: boolean;
  auto: boolean;
};

export type HubBooking = {
  id: string;
  name: string;
  phone: string | null;
  address: string;
  service: string;
  frequency: string;
  day: string | null;
  time: string | null;
  status: string;
};

export type HubCall = {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  status: string;
  outcome: string | null;
  durationSecs: number | null;
  at: string;
};

export type HubOverview = {
  name: string | null;
  unreadByChannel: Record<string, number>;
  totalUnread: number;
  missedCalls: number;
  reminders: HubReminder[];
  bookings: HubBooking[];
  calls: HubCall[];
};

export type HubThread = {
  id: string;
  channel: string;
  contactKey: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  snippet: string | null;
  lastDirection: string | null;
  lastMessageAt: string;
  unread: number;
  consent: "opted_in" | "opted_out" | "unknown" | null;
};

export type HubMessage = {
  id: string;
  direction: "in" | "out";
  channel: string;
  body: string;
  subject: string | null;
  status: string;
  error: string | null;
  author: string | null;
  at: string;
  /** Twilio/Resend message id, used to match delivery receipts. */
  providerId: string | null;
  /** True when this outbound text failed for a reason worth resending. */
  retryable: boolean;
};

export type HubSearchKind = "call" | "sms" | "chat" | "email" | "messenger" | "slack" | "lead";

export type HubSearchResult = {
  id: string;
  kind: HubSearchKind;
  title: string;
  subtitle: string | null;
  snippet: string | null;
  at: string | null;
  /** Thread id when the result is a conversation. */
  threadId: string | null;
  /** Phone / email / contact key used to jump into a channel. */
  contactKey: string | null;
  /** External admin page for leads and calls. */
  link: string | null;
};

export type HubDeliveryRow = {
  id: string;
  channel: "email" | "sms";
  recipient: string;
  subject: string;
  kind: string;
  status: string;
  deliveryStatus: string | null;
  detail: string | null;
  providerId: string | null;
  at: string;
  canRetry: boolean;
};

export type HubWebhookRow = {
  id: string;
  provider: string;
  route: string;
  eventType: string | null;
  status: string;
  attempts: number;
  error: string | null;
  receivedAt: string;
};

export type HubDeliveryStatus = {
  counts: {
    sent24h: number;
    failed24h: number;
    bounced7d: number;
    smsFailed24h: number;
    webhooksFailed24h: number;
    duplicatesSuppressed7d: number;
  };
  deliveries: HubDeliveryRow[];
  webhooks: HubWebhookRow[];
};
