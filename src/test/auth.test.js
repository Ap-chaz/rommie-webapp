import { describe, expect, it, vi } from "vitest";
import { matchRoutes } from "react-router-dom";
import { routes } from "@/routes";
import { safeRedirect, homeFor } from "@/lib/auth";
import { AuthError, getMyListings, login, loginWithGoogle, loginWithOtp, setMyPhone, logout, sendOtp, setRoomStatus, signUp, verifyOtp, getSession } from "@/services/api";
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
        const u = await signUp({ name: "Test Caretaker", email: "test.caretaker@example.com", phone, password: "password123", role: "caretaker" });
        expect(u.phoneVerified).toBe(false);
        await expect(signUp({ name: "Dup", email: "dup@example.com", phone, password: "password123", role: "student" })).rejects.toMatchObject({ field: "phone" });
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

describe("email and Google sign-in", () => {
    it("logs in with email and password, ignoring case and spaces", async () => {
        await logout();
        const u = await login({ email: "  Wanjiru@Example.com ", password: "password123" });
        expect(u).toMatchObject({ id: "c1", email: "wanjiru@example.com" });
        expect(u.password).toBeUndefined();
        await logout();
        await expect(login({ email: "wanjiru@example.com", password: "wrong" })).rejects.toMatchObject({ message: "Email or password is incorrect." });
        await expect(login({ email: "nobody@example.com", password: "password123" })).rejects.toBeInstanceOf(AuthError);
    });
    it("sign-up needs a valid, unused email", async () => {
        await logout();
        await expect(signUp({ name: "A B", email: "nope", phone: "+254799123456", password: "password123", role: "student" })).rejects.toMatchObject({ field: "email" });
        await expect(signUp({ name: "A B", email: "AMINA@example.com", phone: "+254799123456", password: "password123", role: "student" })).rejects.toMatchObject({ field: "email" });
        const u = await signUp({ name: "New Student", email: "New.Student@Example.com", phone: "+254799123456", password: "password123", role: "student" });
        expect(u.email).toBe("new.student@example.com");
        await logout();
        await expect(login({ email: "new.student@example.com", password: "password123" })).resolves.toMatchObject({ name: "New Student" });
    }, 20000);
    it("Google creates an account on first use, then signs the same person back in", async () => {
        await logout();
        const first = await loginWithGoogle({ email: "Grace.G@gmail.com", name: "Grace G", role: "caretaker" });
        expect(first).toMatchObject({ role: "caretaker", email: "grace.g@gmail.com", phone: "", phoneVerified: false });
        await logout();
        const again = await loginWithGoogle({ email: "grace.g@gmail.com", role: "caretaker" });
        expect(again.id).toBe(first.id);
        await logout();
        await expect(login({ email: "grace.g@gmail.com", password: "anything" })).rejects.toThrow(/uses Google/);
        await expect(loginWithGoogle({ email: "bad", role: "student" })).rejects.toMatchObject({ field: "email" });
    }, 20000);
    it("a Google account adds its phone, which then needs verifying", async () => {
        await logout();
        await loginWithGoogle({ email: "phone.add@gmail.com", name: "Phone Add", role: "student" });
        await expect(setMyPhone("+254712345678")).rejects.toMatchObject({ field: "phone" });
        await setMyPhone("+254755000111");
        expect(getSession()).toMatchObject({ phone: "+254755000111", phoneVerified: false });
        await sendOtp("+254755000111");
        expect(await verifyOtp("+254755000111", "123456")).toEqual({ ok: true });
        expect(getSession()?.phoneVerified).toBe(true);
    }, 20000);
});
