import { describe, it, expect } from "vitest";
import { getServiceRate, priceHome } from "./pricing";

describe("Dallas base prices", () => {
  it("Standard Clean starts at $169", () => expect(getServiceRate("Standard Clean").base).toBe(169));
  it("Deep Clean starts at $329", () => expect(getServiceRate("Deep Clean").base).toBe(329));
  it("Airbnb Turnover starts at $149", () => expect(getServiceRate("Airbnb Turnover").base).toBe(149));
  it("4bd/2.5ba biweekly Standard Clean quotes $184", () =>
    expect(priceHome({ service: "Standard Clean", frequency: "Biweekly", bedrooms: 4, bathrooms: 2.5 }).total).toBe(184));
});

import { quoteVisit, founderSpotsLeft, FOUNDER_LIMIT } from "./pricing";
describe("Founder rate", () => {
  it("takes 15% off: $169 standard becomes $144", () => {
    const q = quoteVisit({ service: "Standard Clean", frequency: "One-time", bedrooms: 2, bathrooms: 2 });
    expect(q.regularTotal).toBe(169);
    expect(q.founderSavings).toBe(25);
    expect(q.total).toBe(144);
  });
  it("can be turned off", () =>
    expect(quoteVisit({ service: "Standard Clean", frequency: "One-time", bedrooms: 2, bathrooms: 2, founder: false }).total).toBe(169));
  it("is limited to 100 clients", () => {
    expect(FOUNDER_LIMIT).toBe(100);
    expect(founderSpotsLeft(97)).toBe(3);
    expect(founderSpotsLeft(120)).toBe(0);
  });
});
