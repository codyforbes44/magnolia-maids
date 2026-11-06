import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address kept so existing links and Google results land on the renamed page.
export const Route = createFileRoute("/summer-on-the-lake")({
  beforeLoad: () => {
    throw redirect({ to: "/dallas-home-cleaning", statusCode: 301 });
  },
});
