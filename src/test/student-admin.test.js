import { beforeEach, describe, expect, it } from "vitest";
import { computeTrust } from "@/lib/trust";
import { alertSummary } from "@/lib/format";
import { createAlert, deleteAlert, getAdminStats, getAlerts, getCaretakerProfile, getMyVerification, getRoom, getRooms, getSavedIds, getSavedRooms, getSession, getVerificationQueue, hideListing, login, logout, reviewVerification, reconfirmRoom, saveRoom, submitVerification, unsaveRoom, updateAlert, } from "@/services/api";
const DAY = 86400000;
const iso = (daysAgo) => new Date(Date.now() - daysAgo * DAY).toISOString();
const png = (name = "id.png") => new File(["x"], name, { type: "image/png" });
describe("computeTrust", () => {
    it("scores a verified, fresh, report-free veteran at 100", () => {
        const t = computeTrust({ verified: true, rooms: [{ status: "Vacant", lastConfirmedVacantAt: iso(2) }], reportCount: 0, joinedAt: iso(400) });
        expect(t.score).toBe(100);
        expect(t.items.map((i) => i.key)).toEqual(["verification", "freshness", "reports", "age"]);
    });
    it("always adds up and loses points for staleness, reports and missing verification", () => {
        const t = computeTrust({
            verified: false,
            rooms: [{ status: "Vacant", lastConfirmedVacantAt: iso(2) }, { status: "Vacant", lastConfirmedVacantAt: iso(30) }],
            reportCount: 2,
            joinedAt: iso(60),
        });
        expect(t.items.reduce((n, i) => n + i.points, 0)).toBe(t.score);
        expect(t.items.find((i) => i.key === "verification").points).toBe(0);
        expect(t.items.find((i) => i.key === "freshness").points).toBe(15);
        expect(t.items.find((i) => i.key === "reports").points).toBe(9);
        expect(t.items.find((i) => i.key === "age").points).toBe(2);
    });
    it("gives a neutral freshness score when there are no vacant rooms, and never goes negative", () => {
        const t = computeTrust({ verified: false, rooms: [], reportCount: 10, joinedAt: iso(0) });
        expect(t.items.find((i) => i.key === "freshness").points).toBe(15);
        expect(t.items.find((i) => i.key === "reports").points).toBe(0);
        expect(t.score).toBeGreaterThanOrEqual(0);
    });
});
describe("alertSummary", () => {
    it("reads like a sentence", () => {
        expect(alertSummary({ roomType: "bedsitter", maxRentKes: 6000, area: "Rongai" })).toBe("Bedsitter under KES 6,000 in Rongai.");
        expect(alertSummary({ area: "Karen" })).toBe("Any room in Karen.");
        expect(alertSummary({ maxRentKes: 8000 })).toBe("Any room under KES 8,000.");
    });
});
describe("student tools (mock service)", () => {
    beforeEach(async () => {
        await logout();
        await login({ phone: "+254711111111", password: "password123" });
    });
    it("saves and unsaves rooms per account, newest first", async () => {
        expect(await getSavedIds()).toEqual([]);
        await saveRoom("r1");
        await saveRoom("r2");
        await saveRoom("r1"); // saving twice doesn't duplicate
        expect(await getSavedIds()).toEqual(["r2", "r1"]);
        expect((await getSavedRooms()).map((r) => r.id)).toEqual(["r2", "r1"]);
        await unsaveRoom("r2");
        expect(await getSavedIds()).toEqual(["r1"]);
        await unsaveRoom("r1");
        await logout();
        expect(await getSavedIds()).toEqual([]);
        await expect(saveRoom("r1")).rejects.toThrow();
    });
    it("creates, pauses and deletes alerts", async () => {
        const a = await createAlert({ area: "Rongai", maxRentKes: 6000, roomType: "bedsitter" });
        expect(a.active).toBe(true);
        await updateAlert(a.id, { active: false });
        expect((await getAlerts()).find((x) => x.id === a.id)?.active).toBe(false);
        await deleteAlert(a.id);
        expect(await getAlerts()).toEqual([]);
    });
    it("walks a student ID through pending to verified, and flags the session", async () => {
        expect((await getMyVerification("student")).status).toBe("none");
        await expect(submitVerification("student", new File(["x"], "notes.txt", { type: "text/plain" }))).rejects.toThrow(/photo or a PDF/);
        await submitVerification("student", png());
        expect((await getMyVerification("student")).status).toBe("pending");
        await expect(submitVerification("student", png())).rejects.toThrow(/already/);
        const mine = (await getVerificationQueue()).find((q) => q.userId === "u1");
        await expect(reviewVerification(mine.id, "rejected", "  ")).rejects.toThrow(/reason/);
        await reviewVerification(mine.id, "rejected", "Photo is blurry");
        const rejected = await getMyVerification("student");
        expect(rejected.status).toBe("rejected");
        expect(rejected.request?.reason).toBe("Photo is blurry");
        await submitVerification("student", png("again.png")); // resubmit after rejection
        const again = (await getVerificationQueue()).find((q) => q.userId === "u1");
        await reviewVerification(again.id, "approved");
        expect((await getMyVerification("student")).status).toBe("approved");
        expect(getSession()?.studentVerified).toBe(true);
    });
});
describe("admin tools (mock service)", () => {
    it("shows seeded requests oldest first", async () => {
        const q = await getVerificationQueue();
        expect(q.filter((r) => r.kind === "student").length).toBeGreaterThanOrEqual(2);
        expect(q.filter((r) => r.kind === "caretaker").length).toBeGreaterThanOrEqual(2);
        const times = q.map((r) => +new Date(r.submittedAt));
        expect(times).toEqual([...times].sort((a, b) => a - b));
    });
    it("approving a caretaker verifies them everywhere and lifts their trust score", async () => {
        const before = (await getRoom("r5")).caretaker;
        expect(before.verified).toBe(false);
        await reviewVerification("v3", "approved");
        const after = (await getRoom("r5")).caretaker;
        expect(after.verified).toBe(true);
        expect(after.trustScore).toBe(before.trustScore + 35);
        expect((await getRooms({})).find((r) => r.id === "r5").caretaker.verified).toBe(true);
    });
    it("hides stale listings from the public but not from the caretaker", async () => {
        const stats = await getAdminStats();
        expect(stats.stale.map((r) => r.id)).toContain("r5");
        expect(stats.openReports).toBeGreaterThan(0);
        await hideListing("r5");
        expect(await getRoom("r5")).toBeNull();
        expect((await getRooms({ vacantOnly: false })).some((r) => r.id === "r5")).toBe(false);
        expect((await getAdminStats()).stale.some((r) => r.id === "r5")).toBe(false);
        const profile = await getCaretakerProfile("c3");
        expect(profile.rooms.some((r) => r.id === "r5" && r.hidden)).toBe(true);
        // The caretaker reconfirming a hidden stale room brings it back and resets the clock.
        await reconfirmRoom("r5");
        expect(await getRoom("r5")).not.toBeNull();
        expect((await getAdminStats()).stale.some((r) => r.id === "r5")).toBe(false);
    });
    it("builds a caretaker profile with a breakdown that adds up", async () => {
        const p = await getCaretakerProfile("c1");
        expect(p.trust.score).toBe(p.trust.items.reduce((n, i) => n + i.points, 0));
        expect(p.caretaker.trustScore).toBe(p.trust.score);
        expect(p.verification.status).toBe("approved"); // seeded as verified
        await expect(getCaretakerProfile("nope")).rejects.toThrow();
    });
});
