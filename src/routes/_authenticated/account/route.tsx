import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AccountShell } from "@/components/account/AccountShell";

export const Route = createFileRoute("/_authenticated/account")({
  component: () => (
    <AccountShell>
      <Outlet />
    </AccountShell>
  ),
});