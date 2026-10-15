import { describe, expect, it } from "vitest";
import { getRooms } from "@/services/api";
import { hostelSeeds } from "@/data/hostels";

describe("hostel listings", () => {
    it("lists the hostels from the JKUAT guide", async () => {
        const list = await getRooms({ roomType: "hostel", vacantOnly: false });
        expect(list).toHaveLength(hostelSeeds.length);
        expect(list.every((r) => r.roomOptions.length > 0 && r.jkuatListed)).toBe(true);
    });
    it("hides gents-only hostels from the ladies filter", async () => {
        const list = await getRooms({ roomType: "hostel", gender: "Ladies", vacantOnly: false });
        expect(list.some((r) => r.gender === "Gents")).toBe(false);
        expect(list.some((r) => r.gender === "Ladies")).toBe(true);
    });
    it("filters by meals and transport", async () => {
        const list = await getRooms({ roomType: "hostel", mealsOnly: true, transportOnly: true, vacantOnly: false });
        expect(list.length).toBeGreaterThan(0);
        expect(list.every((r) => r.meals === "available" && r.transport)).toBe(true);
    });
    it("keeps hostels when searching near JKUAT", async () => {
        const list = await getRooms({ near: "JKUAT", roomType: "hostel", vacantOnly: false });
        expect(list.length).toBe(hostelSeeds.length);
    });
    it("shows the cheapest monthly price as the headline rent", async () => {
        const list = await getRooms({ roomType: "hostel", vacantOnly: false });
        const mirvins = list.find((r) => r.title === "Mirvins Hostel");
        expect(mirvins.rentKes).toBe(14750);
    });
});
