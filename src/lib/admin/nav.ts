import {
  LayoutDashboard,
  CalendarCheck,
  Sparkles,
  Users,
  Megaphone,
  MessagesSquare,
  FileText,
  DollarSign,
  UserCog,
  Settings,
  Mail,
  Home,
  Building2,
  CalendarClock,
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
    to: "/admin/properties",
    label: "Properties",
    icon: Building2,
    description: "Apartment & property turnover inquiries",
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
    to: "/admin/emails",
    label: "Email templates",
    icon: Mail,
    description: "Preview and test every automated email",
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