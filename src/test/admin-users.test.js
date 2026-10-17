import { describe, expect, it } from "vitest";
import { getAdminUsers, getRoom, getRooms, getVerificationHistory, getVerificationQueue, getActivity, login, logout, reviewVerification, setCaretakerSuspended, undoVerificationReview, getAdminStats } from "@/services/api";
import { filterUsers } from "@/lib/adminFilters";

const asAdmin = async () => { await logout(); await login({ phone: "+254700000000", password: "password123" }); };

describe("admin users", () => {
    it("is admin-only", async () => {
        await logout();
        await expect(getAdminUsers()).rejects.toThrow();
        await login({ phone: "+254711111111", password: "password123" });
        await expect(getAdminUsers()).rejects.toThrow("Admins only");
        await expect(setCaretakerSuspended("c1", true)).rejects.toThrow("Admins only");
        await expect(getVerificationHistory()).rejects.toThrow("Admins only");
    });

    it("lists caretakers (with hostels) and students, never admins or passwords", async () => {
        await asAdmin();
        const { caretakers, students } = await getAdminUsers();
        expect(caretakers.find((c) => c.id === "c1")).toMatchObject({ name: "Mama Wanjiru", verified: true, suspended: false, hasAccount: true });
        expect(caretakers.some((c) => c.isHostel)).toBe(true);
        expect(students.map((s) => s.id)).toEqual(expect.arrayContaining(["u1", "seed-s1"]));
        expect(JSON.stringify({ caretakers, students })).not.toMatch(/password|Rommie Admin/);
    });

    it("suspending hides their listings and blocks login; restoring brings it all back", async () => {
        await asAdmin();
        const before = (await getRooms()).filter((r) => r.caretakerId === "c2").length;
        expect(before).toBeGreaterThan(0);
        const liveBefore = (await getAdminStats()).totalListings;
        await setCaretakerSuspended("c2", true);
        expect((await getRooms()).some((r) => r.caretakerId === "c2")).toBe(false);
        expect(await getRoom("r2")).toBeNull();
        expect((await getAdminStats()).totalListings).toBeLessThan(liveBefore);
        expect((await getAdminUsers()).caretakers.find((c) => c.id === "c2").suspended).toBe(true);
        await logout();
        await expect(login({ phone: "+254722111222", password: "password123" })).rejects.toThrow(/suspended/);
        await asAdmin();
        await setCaretakerSuspended("c2", false);
        expect((await getRooms()).filter((r) => r.caretakerId === "c2").length).toBe(before);
        await logout();
        await expect(login({ phone: "+254722111222", password: "password123" })).resolves.toMatchObject({ id: "c2" });
        await asAdmin();
        const log = (await getActivity()).map((a) => a.action);
        expect(log).toEqual(expect.arrayContaining(["caretaker.suspended", "caretaker.restored"]));
    }, 30000);

    it("filters by name, phone digits and status", () => {
        const list = [{ name: "Ann", phone: "+254700123123", verified: false }, { name: "Bob", phone: "+254711000000", verified: true, suspended: true }];
        expect(filterUsers(list, { q: "ann" })).toHaveLength(1);
        expect(filterUsers(list, { q: "0711 000" })).toHaveLength(1);
        expect(filterUsers(list, { status: "verified" })).toHaveLength(1);
        expect(filterUsers(list, { status: "unverified" })[0].name).toBe("Ann");
        expect(filterUsers(list, { status: "suspended" })[0].name).toBe("Bob");
    });
});

describe("verification history", () => {
    it("records who decided, and undo puts it back in the queue", async () => {
        await asAdmin();
        expect((await getVerificationQueue()).some((q) => q.id === "v3")).toBe(true);
        await reviewVerification("v3", "approved");
        expect((await getVerificationQueue()).some((q) => q.id === "v3")).toBe(false);
        let h = await getVerificationHistory();
        expect(h[0]).toMatchObject({ id: "v3", status: "approved", reviewedBy: "Rommie Admin" });
        expect((await getAdminUsers()).caretakers.find((c) => c.id === "c3").verified).toBe(true);
        await undoVerificationReview("v3");
        expect((await getVerificationQueue()).some((q) => q.id === "v3")).toBe(true);
        expect((await getAdminUsers()).caretakers.find((c) => c.id === "c3").verified).toBe(false);
        await expect(undoVerificationReview("v3")).rejects.toThrow(/already waiting/);
        h = await getVerificationHistory();
        expect(h.some((x) => x.id === "v3")).toBe(false);
        const actions = (await getActivity()).map((a) => a.action);
        expect(actions).toEqual(expect.arrayContaining(["verification.approved", "verification.undone"]));
    });

    it("still requires a reason to reject", async () => {
        await asAdmin();
        await expect(reviewVerification("v4", "rejected", " ")).rejects.toThrow(/reason/);
        await reviewVerification("v4", "rejected", "Blurry photo");
        expect((await getVerificationHistory())[0]).toMatchObject({ id: "v4", status: "rejected", reason: "Blurry photo" });
    });
});

import { filterActivity } from "@/lib/adminFilters";
describe("activity", () => {
    it("groups entries by the prefix of the action", () => {
        const list = [{ action: "listing.hidden" }, { action: "report.dismissed" }, { action: "verification.approved" }, { action: "caretaker.suspended" }];
        expect(filterActivity(list, "all")).toHaveLength(4);
        expect(filterActivity(list, "report")).toEqual([{ action: "report.dismissed" }]);
        expect(filterActivity(list, "caretaker")).toHaveLength(1);
    });
    it("keeps entries newest first and is admin-only", async () => {
        await logout();
        await expect(getActivity()).rejects.toThrow();
        await asAdmin();
        const log = await getActivity();
        for (let i = 1; i < log.length; i++)
            expect(+new Date(log[i - 1].at)).toBeGreaterThanOrEqual(+new Date(log[i].at));
    }, 20000);
});
