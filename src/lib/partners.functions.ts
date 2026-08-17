import { createServerFn } from "@tanstack/react-start";

/** Public: current plan.It redemption code for the perk landing page. */
export const getPlanitCode = createServerFn({ method: "GET" }).handler(async () => {
  const { loadPlanitCode } = await import("./partners.server");
  return { code: await loadPlanitCode() };
});
