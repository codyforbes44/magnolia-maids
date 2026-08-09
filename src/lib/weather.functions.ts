import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { fetchDurantWeather } from "./weather.server";

export const getDurantWeather = createServerFn({ method: "GET" }).handler(async () => {
  const data = await fetchDurantWeather();
  // Cache at the edge for 30 minutes; serve stale while revalidating.
  setResponseHeader("Cache-Control", "public, max-age=0, s-maxage=1800, stale-while-revalidate=3600");
  return data;
});