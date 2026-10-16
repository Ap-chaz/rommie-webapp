import { describe, expect, it } from "vitest";
import { createListing, getBuildingRooms, updateListing } from "@/services/api";

const base = { description: "d", depositTerms: "One month", area: "Karen", distances: {}, matatuFareKes: 0, amenities: [], photos: ["a.jpg"], mapLink: "https://x.test", whatsappNumber: "+254712345678", callNumber: "+254712345678", status: "Vacant", caretakerId: "c1", lastConfirmedVacantAt: new Date().toISOString() };

describe("rooms in the same building", () => {
    it("lists the other room types that share a buildingId", async () => {
        const a = await createListing({ ...base, title: "Bedsitter", roomType: "bedsitter", rentKes: 7000, buildingId: "b-test" });
        const b = await createListing({ ...base, title: "One bedroom", roomType: "one_bedroom", rentKes: 14000, buildingId: "b-test" });
        await createListing({ ...base, title: "Elsewhere", roomType: "single_room", rentKes: 4000, buildingId: "other" });
        const sibs = await getBuildingRooms("b-test", a.id);
        expect(sibs.map((r) => r.id)).toEqual([b.id]);
    });
    it("hides a hidden listing from its siblings", async () => {
        const a = await createListing({ ...base, title: "A", roomType: "bedsitter", rentKes: 7000, buildingId: "b-hide" });
        const b = await createListing({ ...base, title: "B", roomType: "single_room", rentKes: 5000, buildingId: "b-hide" });
        await updateListing(b.id, { hidden: true });
        expect(await getBuildingRooms("b-hide", a.id)).toEqual([]);
    });
});
