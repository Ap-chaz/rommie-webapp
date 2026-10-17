import { useSyncExternalStore } from "react";
import { CONTACT, SUPPORT_EMAIL } from "@/lib/site";
import { normalizeKenyanPhone } from "@/lib/format";

/** Details an admin can change without a deploy. Everything else stays in site.js. */
export const DEFAULT_SETTINGS = Object.freeze({
    whatsapp: CONTACT.phone,
    phone: CONTACT.phone,
    email: SUPPORT_EMAIL,
    hours: CONTACT.hours,
    location: CONTACT.location,
});
const KEY = "rommie.settings";
const listeners = new Set();
let cache = null;
function read() {
    if (cache)
        return cache;
    let saved = {};
    try {
        saved = JSON.parse(window.localStorage.getItem(KEY) ?? "{}") ?? {};
    }
    catch { /* storage unavailable: defaults apply */ }
    cache = { ...DEFAULT_SETTINGS, ...saved };
    return cache;
}
export const getSettings = () => (typeof window === "undefined" ? DEFAULT_SETTINGS : read());
export function saveSettings(next) {
    cache = { ...DEFAULT_SETTINGS, ...next };
    try {
        window.localStorage.setItem(KEY, JSON.stringify(cache));
    }
    catch { /* the change stays in memory only */ }
    listeners.forEach((l) => l());
}
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
/** "+254700000000" becomes "+254 700 000 000". */
export const displayPhone = (e164) => (/^\+254\d{9}$/.test(e164) ? `+254 ${e164.slice(4, 7)} ${e164.slice(7, 10)} ${e164.slice(10)}` : e164);
/** Turn stored settings into what the footer and help pages need. */
export function deriveContact(s) {
    const wa = s.whatsapp ? s.whatsapp.replace(/\D/g, "") : "";
    return {
        email: s.email,
        hours: s.hours,
        location: s.location,
        phone: s.phone,
        phoneDisplay: displayPhone(s.phone),
        whatsappDisplay: displayPhone(s.whatsapp),
        whatsappLink: wa ? `https://wa.me/${wa}?text=${encodeURIComponent("Hi Rommie, I need help with")}` : "",
    };
}
let derived = null;
let derivedFrom = null;
function snapshot() {
    const s = getSettings();
    if (derivedFrom !== s) {
        derivedFrom = s;
        derived = deriveContact(s);
    }
    return derived;
}
/** Live contact details for components. Updates everywhere when an admin saves new ones. */
export const useSiteSettings = () => useSyncExternalStore(subscribe, snapshot, () => deriveContact(DEFAULT_SETTINGS));
/** Validate the admin form. Returns { values } or { errors } keyed by field. */
export function validateSettings(input) {
    const errors = {};
    const values = {};
    for (const f of ["whatsapp", "phone"]) {
        const raw = (input[f] ?? "").trim();
        if (!raw) {
            values[f] = "";
            continue;
        }
        const n = normalizeKenyanPhone(raw);
        if (!n)
            errors[f] = "Enter a valid Kenyan number, like 0712 345 678.";
        else
            values[f] = n;
    }
    const email = (input.email ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.email = "Enter a valid email address.";
    values.email = email;
    for (const [f, label] of [["hours", "hours"], ["location", "location"]]) {
        const v = (input[f] ?? "").trim();
        if (v.length > 80)
            errors[f] = `Keep the ${label} under 80 characters.`;
        values[f] = v;
    }
    return Object.keys(errors).length ? { errors } : { values };
}
