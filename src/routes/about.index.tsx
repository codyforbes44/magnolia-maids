import { createFileRoute, redirect } from "@tanstack/react-router";

// Archived while Magnolia Maids is paused — original lives in src/_archive/routes.
export const Route = createFileRoute("/about/")({
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});
