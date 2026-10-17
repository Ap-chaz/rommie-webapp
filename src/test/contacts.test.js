import { describe, expect, it } from "vitest";
import { getAdminListings, getAdminStats, login, logout, trackContact } from "@/services/api";

const asAdmin = async () => { await logout(); await login({ phone: "+254700000000", password: "password123" }); };
const count = async () => (await getAdminStats()).contactsMade;
const forRoom = async (id) => (await getAdminListings()).find((r) => r.id === id).contactCount;

describe("contact tracking", () => {
    it("starts at zero instead of a made-up number", async () => {
        await asAdmin();
        expect(await count()).toBe(0);
    });

    it("counts a visitor's WhatsApp and Call taps, per listing", async () => {
        await asAdmin();
        const before = await count();
        const r1 = await forRoom("r1");
        await logout();
        trackContact("r1", "whatsapp");
        trackContact("r1", "call");
        await asAdmin();
        expect(await count()).toBe(before + 2);
        expect(await forRoom("r1")).toBe(r1 + 2);
    });

    it("counts a repeat tap on the same listing and channel only once", async () => {
        await asAdmin();
        const before = await count();
        await logout();
        trackContact("r8", "whatsapp");
        trackContact("r8", "whatsapp");
        trackContact("r8", "whatsapp");
        await asAdmin();
        expect(await count()).toBe(before + 1);
    });

    it("ignores admins, the listing's own caretaker, unknown listings and unknown channels", async () => {
        await asAdmin();
        const before = await count();
        trackContact("r9", "call"); // admin
        await logout();
        await login({ phone: "+254722111222", password: "password123" }); // John Otieno owns r9
        trackContact("r9", "call");
        trackContact("nope", "call");
        trackContact("r9", "carrier-pigeon");
        await asAdmin();
        expect(await count()).toBe(before);
    });

    it("counts a signed-in student's tap", async () => {
        await asAdmin();
        const before = await count();
        await logout();
        await login({ phone: "+254711111111", password: "password123" });
        trackContact("r10", "call");
        await asAdmin();
        expect(await count()).toBe(before + 1);
    });
});
