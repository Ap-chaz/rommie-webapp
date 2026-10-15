import { describe, expect, it } from "vitest";
import { formatKes, normalizeKenyanPhone, STALE_DAYS } from "@/lib/format";
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
