import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, PanelLeftClose, PanelLeft, LogOut, ExternalLink, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_NAV } from "@/lib/admin/nav";

const STORAGE_KEY = "mm-admin-sidebar-collapsed";

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      setEmail(userData.user.email ?? "");
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      setIsAdmin((roles ?? []).some((r) => r.role === "admin"));
    })();
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const active = (to: string) =>
    to === "/admin" ? pathname === "/admin" : pathname.startsWith(to);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {ADMIN_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = active(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={`tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border/60 bg-card transition-[width] lg:flex ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border/60 px-3">
          {!collapsed && (
            <Link to="/" className="min-w-0 flex-1">
              <div className="font-display text-base font-semibold leading-tight">
                Magnolia Maids
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Control center
              </div>
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ml-auto rounded-lg border border-border p-2 hover:bg-secondary"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        {nav}
        <div className="border-t border-border/60 p-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed && <span>View live site</span>}
          </a>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-72 flex-col bg-card shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
              <span className="font-display font-semibold">Magnolia Maids</span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg border border-border p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className={`flex min-h-screen flex-col ${collapsed ? "lg:pl-[68px]" : "lg:pl-64"}`}>
        <header data-admin-topbar className="sticky top-0 z-30 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 bg-background/95 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg border border-border p-2 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="hidden lg:block" />
          <div className="min-w-0 truncate text-right text-xs text-muted-foreground sm:text-sm">
            {email && (
              <>
                Signed in as <span className="font-semibold text-foreground">{email}</span>
              </>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {isAdmin === false ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-border/60 bg-card p-8 text-center">
              <h1 className="font-display text-2xl font-bold">Access pending</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This account doesn't have admin access yet. Ask an existing admin to invite{" "}
                <span className="font-semibold text-foreground">{email}</span> from the Team page,
                then refresh.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
    </header>
  );
}