import {
  LayoutDashboard,
  CalendarCheck,
  Sparkles,
  Users,
  Megaphone,
  MessagesSquare,
  Bot,
  FileText,
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
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    to: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Pipeline, today's activity, and alerts",
  },
  {
    to: "/admin/bookings",
    label: "Bookings",
    icon: CalendarCheck,
    description: "Booking requests and the job calendar",
  },
  {
    to: "/admin/leads",
    label: "Leads",
    icon: Sparkles,
    description: "Campaign landing page leads",
  },
  {
    to: "/admin/change-requests",
    label: "Change requests",
    icon: CalendarClock,
    description: "Customer reschedule & cancellation requests",
  },
  {
    to: "/admin/properties",
    label: "Properties",
    icon: Building2,
    description: "Apartment & property turnover inquiries",
  },
  {
    to: "/admin/franchise",
    label: "Franchise",
    icon: Landmark,
    description: "Ownership interest pipeline (pre-offer)",
  },
  {
    to: "/admin/applications",
    label: "Applications",
    icon: Users,
    description: "Cleaner hiring pipeline",
  },
  {
    to: "/admin/facebook",
    label: "Marketing",
    icon: Megaphone,
    description: "Facebook page, ads, insights, lead ads",
  },
  {
    to: "/admin/nextdoor",
    label: "Nextdoor",
    icon: Home,
    description: "Neighbor attribution, pixel, and API access",
  },
  {
    to: "/admin/conversations",
    label: "Conversations",
    icon: MessagesSquare,
    description: "Assistant voice & chat history with transcripts",
  },
  {
    to: "/admin/agents",
    label: "Voice agents",
    icon: Bot,
    description: "Maggie's prompts, voices, and knowledge base",
  },
  {
    to: "/admin/content",
    label: "Content",
    icon: FileText,
    description: "Page copy, FAQs, campaigns, banner",
  },
  {
    to: "/admin/pricing",
    label: "Pricing",
    icon: DollarSign,
    description: "Service rates, add-ons, discounts",
  },
  {
    to: "/admin/quote-builder",
    label: "Quote builder",
    icon: FileSignature,
    description: "Build a quote on the phone and print a formal PDF",
  },
  {
    to: "/admin/emails",
    label: "Email templates",
    icon: Mail,
    description: "Preview and test every automated email",
  },
  {
    to: "/admin/sms-templates",
    label: "SMS templates",
    icon: MessageSquareText,
    description: "Preview every text with sample variables",
  },
  {
    to: "/admin/sms-log",
    label: "SMS log",
    icon: MessagesSquare,
    description: "Delivery status, errors, STOP/START replies",
  },
  {
    to: "/admin/team",
    label: "Team",
    icon: UserCog,
    description: "Who can access this dashboard",
  },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: Settings,
    description: "Business info, email log, integrations",
  },
];