import { beforeAll, describe, expect, it } from "vitest";
import { filterAdminListings, isStale } from "@/lib/adminFilters";
import { adminDeleteListing, adminUpdateListing, getActivity, getAdminListings, getReports, getRoom, hideListing, login, logout, submitReport } from "@/services/api";

const asAdmin = async () => { await logout(); await login({ phone: "+254700000000", password: "password123" }); };

describe("admin listings manager (service)", () => {
    beforeAll(asAdmin);

    it("is for admins only", async () => {
        await logout();
        await login({ phone: "+254711111111", password: "password123" });
        await expect(getAdminListings()).rejects.toThrow(/Admins only/);
        await expect(adminUpdateListing("r1", { title: "Hello there" })).rejects.toThrow(/Admins only/);
        await expect(adminDeleteListing("r1")).rejects.toThrow(/Admins only/);
        await asAdmin();
    });

    it("returns every listing including hidden ones, newest first", async () => {
        await hideListing("r4");
        const all = await getAdminListings();
        expect(all.find((r) => r.id === "r4").hidden).toBe(true);
        expect(all.length).toBeGreaterThanOrEqual(30);
        const times = all.map((r) => +new Date(r.createdAt));
        expect(times).toEqual([...times].sort((a, b) => b - a));
        expect(all[0].caretaker.name).toBeTruthy();
    });

    it("edits the title, description and rent, and logs what changed", async () => {
        await adminUpdateListing("r6", { title: "  Bright Bedsitter, Maasai Lodge (fixed)  ", description: "Updated text.", rentKes: 6000 });
        const r = await getRoom("r6");
        expect(r.title).toBe("Bright Bedsitter, Maasai Lodge (fixed)");
        expect(r.description).toBe("Updated text.");
        expect(r.rentKes).toBe(6000);
        const entry = (await getActivity()).find((e) => e.action === "listing.edited");
        expect(entry.summary).toMatch(/title, description, rent from KES 6,500 to KES 6,000/);
    });

    it("rejects bad edits and changes nothing", async () => {
        await expect(adminUpdateListing("r6", { title: "abc" })).rejects.toThrow(/5 to 80/);
        await expect(adminUpdateListing("r6", { rentKes: -5 })).rejects.toThrow(/whole shillings/);
        await expect(adminUpdateListing("r6", { rentKes: 1200.5 })).rejects.toThrow(/whole shillings/);
        await expect(adminUpdateListing("r6", { description: "x".repeat(601) })).rejects.toThrow(/600/);
        await expect(adminUpdateListing("nope", { title: "Valid title" })).rejects.toThrow(/not found/);
        expect((await getRoom("r6")).rentKes).toBe(6000);
    });

    it("does not log an edit when nothing changed", async () => {
        const before = (await getActivity()).length;
        await adminUpdateListing("r6", { title: "Bright Bedsitter, Maasai Lodge (fixed)", rentKes: 6000 });
        expect((await getActivity()).length).toBe(before);
    });

    it("won't edit hostel rent, since it comes from the room options", async () => {
        const hostel = (await getAdminListings()).find((r) => r.roomOptions?.length);
        await expect(adminUpdateListing(hostel.id, { rentKes: 1 })).rejects.toThrow(/room options/);
        await adminUpdateListing(hostel.id, { title: `${hostel.title} ` }); // same title once trimmed: fine
    });

    it("deletes a listing for good and closes its open reports", async () => {
        await submitReport("r7", "Fake listing");
        expect((await getReports("open")).some((x) => x.roomId === "r7")).toBe(true);
        await adminDeleteListing("r7");
        expect((await getAdminListings()).some((r) => r.id === "r7")).toBe(false);
        expect(await getRoom("r7")).toBeNull();
        const closed = (await getReports("handled")).filter((x) => x.roomId === "r7");
        expect(closed.length).toBeGreaterThan(0);
        expect(closed.every((x) => x.action === "deleted" && x.room === null)).toBe(true);
        await expect(adminDeleteListing("r7")).rejects.toThrow(/not found/);
        expect((await getActivity())[0].action).toBe("listing.deleted");
    });
});

describe("filterAdminListings", () => {
    const day = 86400000;
    const mk = (o) => ({ id: "x", title: "T", area: "Karen", roomType: "bedsitter", status: "Vacant", hidden: false, caretaker: { name: "Mama Wanjiru" }, lastConfirmedVacantAt: new Date().toISOString(), ...o });
    const list = [
        mk({ id: "a", title: "Bedsitter near KSL" }),
        mk({ id: "b", title: "Single in Rongai", area: "Rongai", roomType: "single_room", caretaker: { name: "John Otieno" } }),
        mk({ id: "c", title: "Taken room", status: "Taken" }),
        mk({ id: "d", title: "Hidden hostel", roomType: "hostel", hidden: true }),
        mk({ id: "e", title: "Old vacancy", lastConfirmedVacantAt: new Date(Date.now() - 20 * day).toISOString() }),
    ];
    const ids = (f) => filterAdminListings(list, f).map((r) => r.id);
    it("matches everything with no filters", () => expect(ids({})).toEqual(["a", "b", "c", "d", "e"]));
    it("searches title, area and caretaker, ignoring case and spaces", () => {
        expect(ids({ q: "  KSL " })).toEqual(["a"]);
        expect(ids({ q: "rongai" })).toEqual(["b"]);
        expect(ids({ q: "otieno" })).toEqual(["b"]);
    });
    it("filters by type, area, status and visibility", () => {
        expect(ids({ roomType: "hostel" })).toEqual(["d"]);
        expect(ids({ area: "Rongai" })).toEqual(["b"]);
        expect(ids({ status: "Taken" })).toEqual(["c"]);
        expect(ids({ visibility: "hidden" })).toEqual(["d"]);
        expect(ids({ visibility: "visible" })).toEqual(["a", "b", "c", "e"]);
    });
    it("finds stale vacancies only, and combines filters", () => {
        expect(ids({ stale: true })).toEqual(["e"]);
        expect(isStale(list[2])).toBe(false);
        expect(ids({ area: "Karen", status: "Vacant", visibility: "visible" })).toEqual(["a", "e"]);
    });
});
