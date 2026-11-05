import { describe, it, expect } from "vitest";
import { getServiceRate, priceHome } from "./pricing";

describe("Dallas base prices", () => {
  it("Standard Clean starts at $169", () => expect(getServiceRate("Standard Clean").base).toBe(169));
  it("Deep Clean starts at $329", () => expect(getServiceRate("Deep Clean").base).toBe(329));
  it("Airbnb Turnover starts at $149", () => expect(getServiceRate("Airbnb Turnover").base).toBe(149));
  it("4bd/2.5ba biweekly Standard Clean quotes $184", () =>
    expect(priceHome({ service: "Standard Clean", frequency: "Biweekly", bedrooms: 4, bathrooms: 2.5 }).total).toBe(184));
});
