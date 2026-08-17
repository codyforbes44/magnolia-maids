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
};
