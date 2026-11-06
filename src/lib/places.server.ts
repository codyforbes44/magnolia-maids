export async function placesRequest(path: string, mask: string, body?: object) {
  const apiKey = process.env["GOOGLE_MAPS_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey || !lovableKey)
    throw new Error("Address lookup is not configured. You can enter your full address manually.");
  const response = await fetch(
    `https://connector-gateway.lovable.dev/google_maps/places/v1/${path}`,
    {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": apiKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": mask,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  if (!response.ok) {
    const text = await response.text();
    console.error(`Places request failed [${response.status}]: ${text}`);
    if (response.status === 403) {
      if (text.includes("API_KEY_HTTP_REFERRER_BLOCKED"))
        throw new Error(
          "Google Maps server key is referrer-restricted. Set the server key's application restrictions to None or IP addresses in Google Cloud Console.",
        );
      if (text.includes("API_KEY_SERVICE_BLOCKED"))
        throw new Error(
          "Enable Places API (New) and add it to the server key's allowed APIs in Google Cloud Console.",
        );
    }
    throw new Error(`Address lookup failed [${response.status}]: ${text}`);
  }
  return response.json();
}
