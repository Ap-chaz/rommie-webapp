import { describe, expect, it } from "vitest";
import { cheapestMonthly, formatKes, genderMatches, monthlyKes, normalizeKenyanPhone, optionPrice, STALE_DAYS } from "@/lib/format";
describe("Kenyan phone normalization", () => {
    it("accepts 07xx numbers", () => expect(normalizeKenyanPhone("0712 345 678")).toBe("+254712345678"));
    it("accepts 01xx numbers", () => expect(normalizeKenyanPhone("0110345678")).toBe("+254110345678"));
    it("accepts +254 numbers", () => expect(normalizeKenyanPhone("+254712345678")).toBe("+254712345678"));
    it("rejects invalid numbers", () => expect(normalizeKenyanPhone("12345")).toBeNull());
});
describe("display rules", () => {
    it("formats rent as KES 8,500", () => expect(formatKes(8500)).toBe("KES 8,500"));
    it("marks rooms stale at 14 days", () => expect(STALE_DAYS).toBe(14));
});

describe("hostel pricing", () => {
    it("turns a semester price into a monthly figure", () => expect(monthlyKes({ rentKes: 59000, billing: "semester" })).toBe(14750));
    it("keeps monthly prices as they are", () => expect(monthlyKes({ rentKes: 12500, billing: "month" })).toBe(12500));
    it("finds the cheapest option across billing periods", () => expect(cheapestMonthly([{ rentKes: 52000, billing: "semester" }, { rentKes: 15000, billing: "month" }])).toBe(13000));
    it("prints ranges", () => expect(optionPrice({ rentKes: 15000, maxKes: 19000, billing: "month" })).toBe("KES 15,000 - 19,000 / month"));
});
describe("gender filter", () => {
    it("lets open rentals through", () => expect(genderMatches({}, "Ladies")).toBe(true));
    it("lets mixed hostels through", () => expect(genderMatches({ gender: "Mixed" }, "Gents")).toBe(true));
    it("hides the other gender", () => expect(genderMatches({ gender: "Ladies" }, "Gents")).toBe(false));
});
