import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { EmptyState, SectionCard, inputClass } from "@/components/admin/ui";
import { grantTeamRole, listTeam, revokeTeamRole, type TeamMember } from "@/lib/admin/team.functions";

export const Route = createFileRoute("/_authenticated/admin/team")({
  head: () => ({
    meta: [
      { title: "Admin — Team | Magnolia Maids" },
      { name: "description", content: "Manage who can access the Magnolia Maids control center." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeamPage,
});

const ROLES = ["admin", "staff"] as const;

function TeamPage() {
  const load = useServerFn(listTeam);
  const grant = useServerFn(grantTeamRole);
  const revoke = useServerFn(revokeTeamRole);

  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("staff");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      setMembers(await load({ data: undefined }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the team.");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await grant({ data: { email: email.trim(), role } });
      setNotice(`${email.trim()} now has ${role} access.`);
      setEmail("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not grant access.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(userId: string, r: string) {
    setError(null);
    setNotice(null);
    try {
      await revoke({ data: { userId, role: r as (typeof ROLES)[number] } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove access.");
    }
  }

  const withRoles = members?.filter((m) => m.roles.length) ?? [];
  const withoutRoles = members?.filter((m) => !m.roles.length) ?? [];

  return (
    <>
      <AdminPageHeader
        title="Team"
        description="Grant or remove access to this dashboard. People must create an account first."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-xl border border-laurel/40 bg-laurel/5 p-4 text-sm text-laurel">
          {notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SectionCard
            title="People with access"
            description="Admins can manage everything. Staff is reserved for limited operational access."
          >
            {!members ? (
              <p className="text-sm text-muted-foreground">Loading team…</p>
            ) : !withRoles.length ? (
              <EmptyState title="No roles assigned yet" />
            ) : (
              <ul className="divide-y divide-border/60">
                {withRoles.map((m) => (
                  <li key={m.userId} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{m.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.roles.join(", ")} ·{" "}
                        {m.lastSignInAt
                          ? `last signed in ${new Date(m.lastSignInAt).toLocaleDateString()}`
                          : "never signed in"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {m.roles.map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRevoke(m.userId, r)}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive"
                        >
                          Remove {r}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Accounts without access"
            description="Signed-up accounts that currently can't open the dashboard."
          >
            {!withoutRoles.length ? (
              <p className="text-sm text-muted-foreground">Everyone signed up has a role.</p>
            ) : (
              <ul className="divide-y divide-border/60 text-sm">
                {withoutRoles.map((m) => (
                  <li key={m.userId} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <span className="truncate">{m.email}</span>
                    <button
                      onClick={async () => {
                        setEmail(m.email);
                        setRole("staff");
                      }}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                    >
                      Use in form
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Grant access">
          <form onSubmit={handleGrant} className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Account email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@magnoliamaids.pro"
                className={`${inputClass} mt-1.5`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Role
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
                className={`${inputClass} mt-1.5`}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Granting…" : "Grant access"}
            </button>
            <p className="text-xs text-muted-foreground">
              The person must sign up at /auth first — then grant them a role here.
            </p>
          </form>
        </SectionCard>
      </div>
    </>
  );
}