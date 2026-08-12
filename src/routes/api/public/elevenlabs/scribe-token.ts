import { createFileRoute } from "@tanstack/react-router";

/**
 * Mints a single-use ElevenLabs Scribe realtime token so the browser can show
 * live partial transcription of what the visitor is saying to Maggie.
 * Tokens expire after ~15 minutes and grant transcription only.
 */
export const Route = createFileRoute("/api/public/elevenlabs/scribe-token")({
  server: {
    handlers: {
      POST: async () => {
        const apiKey = process.env["ELEVENLABS_API_KEY"];
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "ElevenLabs is not connected" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }

        const res = await fetch(
          "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
          { method: "POST", headers: { "xi-api-key": apiKey } },
        );

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error(`Scribe token request failed [${res.status}]: ${body}`);
          return new Response(JSON.stringify({ error: body || "Token request failed" }), {
            status: res.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        const data = (await res.json()) as { token?: string };
        return new Response(JSON.stringify({ token: data.token ?? null }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});