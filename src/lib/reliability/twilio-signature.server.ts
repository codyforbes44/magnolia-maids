import { createHmac } from "crypto";

/**
 * Validates the X-Twilio-Signature header. When TWILIO_AUTH_TOKEN is not set
 * the request is accepted (so carrier-required STOP/HELP keeps working) but a
 * warning is logged.
 */
export function verifyTwilioSignature(
  requestUrl: string,
  body: URLSearchParams,
  signature: string | null,
  label = "twilio",
): boolean {
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  if (!authToken) {
    console.warn(`[${label}] TWILIO_AUTH_TOKEN not set; signature verification disabled`);
    return true;
  }
  if (!signature) return false;
  const sorted = new URLSearchParams(body);
  sorted.sort();
  let payload = requestUrl;
  for (const [k, v] of sorted.entries()) payload += `${k}${v}`;
  const expected = createHmac("sha1", authToken).update(payload).digest("base64");
  return signature === expected;
}
