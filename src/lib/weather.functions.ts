import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { fetchDallasWeather } from "./weather.server";

export const getDallasWeather = createServerFn({ method: "GET" }).handler(async () => {
  const data = await fetchDallasWeather();
  // Never cache weather: always fetch current NWS conditions on page load.
  setResponseHeader("Cache-Control", "no-store, must-revalidate");
  return data;
});