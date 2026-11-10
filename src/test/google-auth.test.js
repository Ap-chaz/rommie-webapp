import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { exchangeGoogleCode, getGoogleAuthUrl, getSession, loginWithGoogle, logout, subscribeSession } from "@/services/api";
import { homeFor, safeRedirect } from "@/lib/auth";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { useLocation } from "@/lib/router";
import GoogleCallbackPage from "@/pages/GoogleCallbackPage";

describe("Google Authentication End-to-End Suite", () => {
    beforeEach(async () => {
        await logout();
        localStorage.clear();
    });

    afterEach(async () => {
        await logout();
        vi.restoreAllMocks();
    });

    it("logs in with Google, stores rommie.token and rommie.session, and sets emailVerified=true", async () => {
        const email = `student.google.${Date.now()}@gmail.com`;
        let sessionNotified = false;
        const unsubscribe = subscribeSession(() => {
            sessionNotified = true;
        });

        const user = await loginWithGoogle({ email, name: "Grace Ochieng", role: "student" });

        expect(user).toBeDefined();
        expect(user.email).toBe(email);
        expect(user.emailVerified).toBe(true);
        expect(user.role).toBe("student");
        expect(sessionNotified).toBe(true);

        const currentSession = getSession();
        expect(currentSession).toBeDefined();
        expect(currentSession.email).toBe(email);
        expect(currentSession.emailVerified).toBe(true);

        const storedSession = JSON.parse(localStorage.getItem("rommie.session") || "null");
        expect(storedSession).toBeDefined();
        expect(storedSession.email).toBe(email);
        expect(storedSession.emailVerified).toBe(true);

        const storedToken = JSON.parse(localStorage.getItem("rommie.token") || "null");
        expect(storedToken).toBeTruthy();

        unsubscribe();
    });

    it("provisions caretaker with Google and verifies home redirection destination", async () => {
        const email = `ct.google.${Date.now()}@gmail.com`;
        const user = await loginWithGoogle({ email, name: "Mwangi Caretaker", role: "caretaker" });

        expect(user.role).toBe("caretaker");
        expect(user.emailVerified).toBe(true);

        // Verification of immediate home routing
        expect(homeFor(user.role)).toBe("/caretaker/listings");
        expect(homeFor("student")).toBe("/rooms");

        // Safe redirect preserves query parameters
        expect(safeRedirect("/caretaker/listings?tab=active")).toBe("/caretaker/listings?tab=active");
        expect(safeRedirect("//evil.com")).toBeUndefined();
    });

    it("supports idToken decoding when idToken is provided without email", async () => {
        const email = `idtoken.${Date.now()}@gmail.com`;
        const header = btoa(JSON.stringify({ alg: "RS256" }));
        const payload = btoa(JSON.stringify({
            email,
            name: "GIS Token User",
            email_verified: true
        }));
        const fakeIdToken = `${header}.${payload}.sig`;

        const user = await loginWithGoogle({ idToken: fakeIdToken, role: "student" });
        expect(user.email).toBe(email);
        expect(user.name).toBe("GIS Token User");
        expect(user.emailVerified).toBe(true);
    });

    it("rejects invalid Google email formats with AuthError", async () => {
        await expect(loginWithGoogle({ email: "invalid-email-string", role: "student" }))
            .rejects.toMatchObject({ field: "email" });
    });

    it("generates Google OAuth 2.0 URL with state and parameters", async () => {
        const url = await getGoogleAuthUrl({ role: "caretaker", redirect: "/caretaker/listings" });
        expect(url).toBeDefined();
        expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
        expect(url).toContain("response_type=code");
        expect(url).toContain("scope=openid");
        expect(url).toContain(encodeURIComponent(JSON.stringify({ role: "caretaker", redirect: "/caretaker/listings" })));
    });

    it("exchanges Google authorization code for authenticated user session", async () => {
        const email = `code.user.${Date.now()}@gmail.com`;
        const code = `mock_code_${email}_Code Exchange User`;

        const user = await exchangeGoogleCode({
            code,
            role: "student",
            redirectUri: "http://localhost:5173/auth/google/callback"
        });

        expect(user).toBeDefined();
        expect(user.email).toBe(email);
        expect(user.emailVerified).toBe(true);

        const currentSession = getSession();
        expect(currentSession).toBeDefined();
        expect(currentSession.email).toBe(email);
    });

    it("supports code in loginWithGoogle payload directly", async () => {
        const email = `direct.code.${Date.now()}@gmail.com`;
        const code = `mock_code_${email}_Direct Code User`;

        const user = await loginWithGoogle({
            code,
            role: "caretaker"
        });

        expect(user.email).toBe(email);
        expect(user.role).toBe("caretaker");
        expect(user.emailVerified).toBe(true);
    });

    it("exports GoogleButton and OrDivider components cleanly", () => {
        expect(typeof GoogleButton).toBe("function");
        expect(typeof OrDivider).toBe("function");
    });

    it("exports useLocation from router and GoogleCallbackPage component cleanly", () => {
        expect(typeof useLocation).toBe("function");
        expect(typeof GoogleCallbackPage).toBe("function");
    });
});
