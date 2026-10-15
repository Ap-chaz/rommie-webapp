import { describe, expect, it, vi } from "vitest";
import { matchRoutes } from "react-router-dom";
import { routes } from "@/routes";
import { safeRedirect, homeFor } from "@/lib/auth";
import { AuthError, getMyListings, login, loginWithOtp, logout, sendOtp, setRoomStatus, signUp, verifyOtp, getSession } from "@/services/api";
describe("safeRedirect", () => {
    it("keeps same-site paths and blocks open redirects", () => {
        expect(safeRedirect("/caretaker/post?x=1")).toBe("/caretaker/post?x=1");
        expect(safeRedirect("//evil.com")).toBeUndefined();
        expect(safeRedirect("https://evil.com")).toBeUndefined();
        expect(safeRedirect("/\\evil.com")).toBeUndefined();
        expect(safeRedirect(undefined)).toBeUndefined();
    });
    it("sends each role home", () => {
        expect(homeFor("student")).toBe("/rooms");
        expect(homeFor("caretaker")).toBe("/caretaker/listings");
        expect(homeFor("admin")).toBe("/admin");
    });
});
describe("mock auth service", () => {
    it("rejects a wrong password and accepts the right one", async () => {
        await expect(login({ phone: "+254712345678", password: "nope" })).rejects.toBeInstanceOf(AuthError);
        const u = await login({ phone: "+254712345678", password: "password123" });
        expect(u.role).toBe("caretaker");
        await logout();
    });
    it("signs up unverified, blocks duplicates, and verifies with 123456", async () => {
        const phone = "+254799000111";
        const u = await signUp({ name: "Test Caretaker", phone, password: "password123", role: "caretaker" });
        expect(u.phoneVerified).toBe(false);
        await expect(signUp({ name: "Dup", phone, password: "password123", role: "student" })).rejects.toMatchObject({ field: "phone" });
        expect((await getMyListings()).length).toBe(0);
        expect(await verifyOtp(phone, "123456")).toEqual({ ok: false, reason: "expired" }); // never sent
        await sendOtp(phone);
        expect(await verifyOtp(phone, "000000")).toEqual({ ok: false, reason: "wrong" });
        expect(await verifyOtp(phone, "123456")).toEqual({ ok: true });
        expect(getSession()?.phoneVerified).toBe(true);
        await logout();
    });
    it("expires codes after 5 minutes", async () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        const phone = "+254711111111";
        await sendOtp(phone);
        vi.setSystemTime(Date.now() + 6 * 60 * 1000);
        expect(await verifyOtp(phone, "123456")).toEqual({ ok: false, reason: "expired" });
        vi.useRealTimers();
    });
    it("logs in with a code", async () => {
        await sendOtp("+254700000000");
        expect((await loginWithOtp("+254700000000", "123456")).role).toBe("admin");
        await logout();
    });
    it("reconfirming a room resets its confirmed date", async () => {
        const [r] = (await getMyListings("c1")).filter((x) => x.status === "Vacant");
        await setRoomStatus(r.id, "Taken");
        await setRoomStatus(r.id, "Vacant");
        const again = (await getMyListings("c1")).find((x) => x.id === r.id);
        expect(Date.now() - new Date(again.lastConfirmedVacantAt).getTime()).toBeLessThan(5000);
    });
});
describe("Phase 2 routes exist", () => {
    it.each(["/login", "/signup", "/caretaker/login", "/caretaker/signup", "/verify-phone", "/caretaker/post", "/caretaker/listings", "/caretaker/edit/r1"])("%s", (p) => {
        expect(matchRoutes(routes, p)?.at(-1)?.route.path).not.toBe("*");
    });
});
