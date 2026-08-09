import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { fetchDurantWeather } from "./weather.server";

export const getDurantWeather = createServerFn({ method: "GET" }).handler(async () => {
  const data = await fetchDurantWeather();
  // Never cache weather: always fetch current NWS conditions on page load.
  setResponseHeader("Cache-Control", "no-store, must-revalidate");
  return data;
});