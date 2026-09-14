import {
  LayoutDashboard,
  CalendarCheck,
  Sparkles,
  Users,
  Megaphone,
  MessagesSquare,
  Bot,
  FileText,
  FileSpreadsheet,
  DollarSign,
  UserCog,
  Settings,
  Mail,
  MessageSquareText,
  Home,
  FileSignature,
  Building2,
  CalendarClock,
  Landmark,
  PhoneCall,
  ImageIcon,
  ListChecks,
  Hash,
  Smartphone,
  BellRing,
  FolderDown,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
  /** Extra words matched by the sidebar quick filter. */
  keywords?: string[];
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "daily",
    label: "Daily",
    items: [
      {
        to: "/admin",
        label: "Overview",
        icon: LayoutDashboard,
        description: "Pipeline, today's activity, and alerts",
        keywords: ["dashboard", "home", "today"],
      },
      {
        to: "/admin/hub",
        label: "Comms hub",
        icon: Smartphone,
        description: "Calls, texts, chats, email, Messenger and Slack in one phone",
        keywords: ["inbox", "phone", "messages"],
      },
    ],
  },
  {
    id: "pipeline",
    label: "Pipeline",
    items: [
      {
        to: "/admin/bookings",
        label: "Bookings",
        icon: CalendarCheck,
        description: "Booking requests and the job calendar",
        keywords: ["jobs", "calendar", "schedule"],
      },
      {
        to: "/admin/leads",
        label: "Leads",
        icon: Sparkles,
        description: "Campaign landing page leads",
        keywords: ["quotes", "prospects"],
      },
      {
        to: "/admin/change-requests",
        label: "Change requests",
        icon: CalendarClock,
        description: "Customer reschedule & cancellation requests",
        keywords: ["reschedule", "cancel"],
      },
      {
        to: "/admin/properties",
        label: "Properties",
        icon: Building2,
        description: "Apartment & property turnover inquiries",
        keywords: ["apartments", "turnover"],
      },
      {
        to: "/admin/franchise",
        label: "Franchise",
        icon: Landmark,
        description: "Ownership interest pipeline (pre-offer)",
        keywords: ["ownership", "investors"],
      },
      {
        to: "/admin/applications",
        label: "Applications",
        icon: Users,
        description: "Cleaner hiring pipeline",
        keywords: ["applicants", "hiring", "jobs"],
      },
    ],
  },
  {
    id: "maggie",
    label: "Maggie & automation",
    items: [
      {
        to: "/admin/conversations",
        label: "Conversations",
        icon: MessagesSquare,
        description: "Assistant voice & chat history with transcripts",
        keywords: ["transcripts", "chat history"],
      },
      {
        to: "/admin/calls",
        label: "Outbound calls",
        icon: PhoneCall,
        description: "Queue and manage Maggie's follow-up calls",
        keywords: ["dialer", "queue"],
      },
      {
        to: "/admin/followups",
        label: "Auto follow-ups",
        icon: BellRing,
        description: "Reminder timing for unanswered calls and unread threads",
        keywords: ["reminders", "automation"],
      },
      {
        to: "/admin/agents",
        label: "Voice agents",
        icon: Bot,
        description: "Maggie's prompts, voices, and knowledge base",
        keywords: ["elevenlabs", "prompt", "knowledge"],
      },
      {
        to: "/admin/maggie-images",
        label: "Maggie images",
        icon: ImageIcon,
        description: "Upload the chatbot avatar and fullscreen portrait",
        keywords: ["avatar", "portrait"],
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & content",
    items: [
      {
        to: "/admin/facebook",
        label: "Facebook",
        icon: Megaphone,
        description: "Facebook page, ads, insights, lead ads",
        keywords: ["meta", "ads", "messenger", "marketing"],
      },
      {
        to: "/admin/nextdoor",
        label: "Nextdoor",
        icon: Home,
        description: "Neighbor attribution, pixel, and API access",
        keywords: ["neighbors", "pixel"],
      },
      {
        to: "/admin/slack",
        label: "Slack",
        icon: Hash,
        description: "Team channel alerts and Maggie's Slack answers",
        keywords: ["channel", "alerts"],
      },
      {
        to: "/admin/content",
        label: "Site content",
        icon: FileText,
        description: "Page copy, FAQs, campaigns, banner",
        keywords: ["copy", "faq", "campaigns"],
      },
      {
        to: "/admin/services-included",
        label: "What's included",
        icon: ListChecks,
        description: "Services page comparison matrix",
        keywords: ["services", "matrix"],
      },
    ],
  },
  {
    id: "money",
    label: "Pricing & money",
    items: [
      {
        to: "/admin/pricing",
        label: "Pricing",
        icon: DollarSign,
        description: "Service rates, add-ons, discounts",
        keywords: ["rates", "discounts"],
      },
      {
        to: "/admin/quote-builder",
        label: "Quote builder",
        icon: FileSignature,
        description: "Build a quote on the phone and print a formal PDF",
        keywords: ["estimate", "pdf"],
      },
      {
        to: "/admin/payments",
        label: "Payments",
        icon: CreditCard,
        description: "Invoice payment links and recurring plans",
        keywords: ["stripe", "invoices", "billing"],
      },
    ],
  },
  {
    id: "messaging",
    label: "Messaging",
    items: [
      {
        to: "/admin/emails",
        label: "Email templates",
        icon: Mail,
        description: "Preview and test every automated email",
        keywords: ["resend", "templates"],
      },
      {
        to: "/admin/email-log",
        label: "Email log",
        icon: Mail,
        description: "Read the full contents of every email sent",
        keywords: ["sent", "history"],
      },
      {
        to: "/admin/sms-templates",
        label: "SMS templates",
        icon: MessageSquareText,
        description: "Preview every text with sample variables",
        keywords: ["text", "twilio"],
      },
      {
        to: "/admin/sms-log",
        label: "SMS log",
        icon: MessagesSquare,
        description: "Delivery status, errors, STOP/START replies",
        keywords: ["text", "delivery", "twilio"],
      },
    ],
  },
  {
    id: "business",
    label: "Business",
    items: [
      {
        to: "/admin/reports",
        label: "Itemized report",
        icon: FileSpreadsheet,
        description: "Download leads, bookings, and applicants as CSV or PDF",
        keywords: ["export", "csv", "pdf"],
      },
      {
        to: "/admin/documents",
        label: "Documents",
        icon: FolderDown,
        description: "Download manuals, brand files, and marketing collateral",
        keywords: ["downloads", "brand kit", "manual"],
      },
      {
        to: "/admin/team",
        label: "Team",
        icon: UserCog,
        description: "Who can access this dashboard",
        keywords: ["admins", "access", "roles"],
      },
      {
        to: "/admin/settings",
        label: "Settings",
        icon: Settings,
        description: "Business info, email log, integrations",
        keywords: ["integrations", "business"],
      },
    ],
  },
];

export const ADMIN_NAV: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export function groupLabelFor(to: string): string | undefined {
  return ADMIN_NAV_GROUPS.find((g) => g.items.some((i) => i.to === to))?.label;
}
