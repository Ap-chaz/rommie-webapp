import { beforeAll, describe, expect, it } from "vitest";
import { getActivity, getAdminStats, getHiddenListings, getReports, getRoom, hideListing, login, logout, restoreListing, reviewReport, submitReport } from "@/services/api";

const asAdmin = async () => { await logout(); await login({ phone: "+254700000000", password: "password123" }); };

describe("reports and restoring hidden listings", () => {
    beforeAll(asAdmin);

    it("keeps these tools for admins only", async () => {
        await logout();
        await login({ phone: "+254711111111", password: "password123" });
        await expect(getReports("open")).rejects.toThrow(/Admins only/);
        await expect(getHiddenListings()).rejects.toThrow(/Admins only/);
        await expect(restoreListing("r1")).rejects.toThrow(/Admins only/);
        await asAdmin();
    });

    it("lists open reports with their listing and caretaker", async () => {
        const open = await getReports("open");
        expect(open.length).toBeGreaterThanOrEqual(2);
        const r = open.find((x) => x.roomId === "r12");
        expect(r.reason).toBe("Wrong price");
        expect(r.room.title).toMatch(/Hillside/);
        expect(r.room.caretaker.name).toBeTruthy();
        expect(open.every((x) => x.status === "open")).toBe(true);
    });

    it("dismissing a report moves it to handled and lowers the open count", async () => {
        const before = (await getAdminStats()).openReports;
        const target = (await getReports("open")).find((x) => x.roomId === "r12");
        await reviewReport(target.id, "dismissed");
        expect((await getAdminStats()).openReports).toBe(before - 1);
        const handled = (await getReports("handled")).find((x) => x.id === target.id);
        expect(handled.status).toBe("dismissed");
        expect(handled.handledBy).toBe("Rommie Admin");
        expect(handled.room.hidden).toBeFalsy();
        await expect(reviewReport(target.id, "resolved")).rejects.toThrow(/already handled/);
    });

    it("rejects an unknown decision or report", async () => {
        const any = (await getReports("open"))[0];
        await expect(reviewReport(any.id, "nonsense")).rejects.toThrow(/Unknown decision/);
        await expect(reviewReport("nope", "dismissed")).rejects.toThrow(/not found/);
    });

    it("hiding from a report hides the listing and closes every open report about it", async () => {
        await submitReport("r2", "Fake listing");
        await submitReport("r2", "Wrong photos", "Photos are from another building");
        const open = (await getReports("open")).filter((x) => x.roomId === "r2");
        expect(open).toHaveLength(2);
        expect(open[0].openOnRoom).toBe(2);
        await reviewReport(open[0].id, "hidden");
        expect(await getRoom("r2")).toBeNull();
        expect((await getReports("open")).some((x) => x.roomId === "r2")).toBe(false);
        const closed = (await getReports("handled")).filter((x) => x.roomId === "r2");
        expect(closed).toHaveLength(2);
        expect(closed.every((x) => x.status === "resolved" && x.action === "hidden")).toBe(true);
    });

    it("lists hidden listings and restores one", async () => {
        const hidden = await getHiddenListings();
        expect(hidden.map((r) => r.id)).toContain("r2");
        expect((await getAdminStats()).hiddenListings).toBe(hidden.length);
        await restoreListing("r2");
        expect(await getRoom("r2")).not.toBeNull();
        expect((await getHiddenListings()).map((r) => r.id)).not.toContain("r2");
        await expect(restoreListing("r2")).rejects.toThrow(/isn't hidden/);
        await expect(restoreListing("nope")).rejects.toThrow(/not found/);
    });

    it("records each action in the activity log, newest first", async () => {
        await hideListing("r3");
        await restoreListing("r3");
        const log = await getActivity();
        expect(log.slice(0, 2).map((e) => e.action)).toEqual(["listing.restored", "listing.hidden"]);
        expect(log[0].actor).toBe("Rommie Admin");
        expect(log.some((e) => e.action === "report.dismissed")).toBe(true);
        const times = log.map((e) => +new Date(e.at));
        expect(times).toEqual([...times].sort((a, b) => b - a));
    });
});
