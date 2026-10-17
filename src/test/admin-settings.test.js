import { describe, expect, it } from "vitest";
import { getAdminAnalytics, getActivity, login, logout, trackContact, updateSiteSettings } from "@/services/api";
import { DEFAULT_SETTINGS, deriveContact, displayPhone, getSettings, validateSettings } from "@/lib/settings";

const asAdmin = async () => { await logout(); await login({ phone: "+254700000000", password: "password123" }); };

describe("site settings", () => {
    it("validates phones, email and lengths", () => {
        const bad = validateSettings({ whatsapp: "123", phone: "0712 345 678", email: "nope", hours: "x".repeat(81), location: "" });
        expect(Object.keys(bad.errors).sort()).toEqual(["email", "hours", "whatsapp"]);
        const ok = validateSettings({ whatsapp: "0712 345 678", phone: "", email: " hi@rommie.co.ke ", hours: " Mon to Fri ", location: "Karen" });
        expect(ok.values).toEqual({ whatsapp: "+254712345678", phone: "", email: "hi@rommie.co.ke", hours: "Mon to Fri", location: "Karen" });
    });
    it("derives display text and a wa.me link, and hides what is empty", () => {
        expect(displayPhone("+254712345678")).toBe("+254 712 345 678");
        const c = deriveContact({ ...DEFAULT_SETTINGS, whatsapp: "+254712345678" });
        expect(c.whatsappLink.startsWith("https://wa.me/254712345678?text=")).toBe(true);
        expect(deriveContact({ ...DEFAULT_SETTINGS, whatsapp: "" }).whatsappLink).toBe("");
    });
    it("only admins can save, bad input names the field, good input is stored and logged", async () => {
        await logout();
        await expect(updateSiteSettings(DEFAULT_SETTINGS)).rejects.toThrow();
        await login({ phone: "+254711111111", password: "password123" });
        await expect(updateSiteSettings(DEFAULT_SETTINGS)).rejects.toThrow("Admins only");
        await asAdmin();
        await expect(updateSiteSettings({ ...DEFAULT_SETTINGS, email: "bad" })).rejects.toMatchObject({ field: "email" });
        expect(getSettings().email).toBe(DEFAULT_SETTINGS.email);
        const saved = await updateSiteSettings({ ...DEFAULT_SETTINGS, hours: "Mon to Sat", phone: "0712 345 678" });
        expect(saved).toMatchObject({ hours: "Mon to Sat", phone: "+254712345678" });
        expect(getSettings().hours).toBe("Mon to Sat");
        const n = (await getActivity()).filter((a) => a.action === "settings.updated").length;
        await updateSiteSettings({ ...DEFAULT_SETTINGS, hours: "Mon to Sat", phone: "0712 345 678" });
        expect((await getActivity()).filter((a) => a.action === "settings.updated").length).toBe(n);
    }, 20000);
});

describe("analytics", () => {
    it("is admin-only and counts what is live", async () => {
        await logout();
        await expect(getAdminAnalytics()).rejects.toThrow();
        await logout();
        trackContact("r2", "whatsapp");
        await asAdmin();
        const a = await getAdminAnalytics();
        expect(a.byArea.reduce((n, r) => n + r.total, 0)).toBe(a.byType.reduce((n, r) => n + r.total, 0));
        expect(a.byType.some((r) => r.key === "hostel")).toBe(true);
        expect(a.vacancyRate).toBeGreaterThan(0);
        expect(a.contactsByDay).toHaveLength(14);
        expect(a.contactsByDay.at(-1).count).toBe(1);
        expect(a.contactsTotal).toBe(1);
        expect(a.topListings[0]).toMatchObject({ id: "r2", count: 1 });
        expect(a.caretakerSignups).toHaveLength(8);
    }, 20000);
});
