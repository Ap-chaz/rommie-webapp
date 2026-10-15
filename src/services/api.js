/**
 * Rommie service layer. UI code calls ONLY these functions.
 * Replace the mock bodies with real HTTP calls when the backend is ready.
 */
import { accounts as seedAccounts, caretakers, rooms as seedRooms, seedReports, seedVerificationRequests } from "@/data/mockData";
import { STALE_DAYS } from "@/lib/format";
import { computeTrust } from "@/lib/trust";
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
let rooms = [...seedRooms];
const reports = [...seedReports];
const uid = () => Math.random().toString(36).slice(2, 10);
/* Small localStorage helpers. Saved rooms, alerts and verification requests survive a reload in the mock;
   a real backend keeps them server-side. Every access is guarded: storage can be missing or full. */
const store = {
    get(key, fallback) {
        if (typeof window === "undefined")
            return fallback;
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        }
        catch {
            return fallback;
        }
    },
    set(key, value) {
        if (typeof window === "undefined")
            return;
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
        catch { /* storage unavailable or full: the change stays in memory only */ }
    },
};
function requireUser() {
    const u = getSession();
    if (!u)
        throw new Error("Log in first.");
    return u;
}
/* ---------- Verification state (shared by students, caretakers and the admin queue) ---------- */
const QUEUE_KEY = "rommie.verification";
let queueCache = null;
function getQueue() {
    if (!queueCache)
        queueCache = store.get(QUEUE_KEY, null) ?? [...seedVerificationRequests];
    return queueCache;
}
function setQueue(q) {
    queueCache = q;
    store.set(QUEUE_KEY, q);
}
const hasApproved = (userId, kind) => getQueue().some((q) => q.userId === userId && q.kind === kind && q.status === "approved");
function isStudentVerified(userId, seeded) {
    return !!seeded || hasApproved(userId, "student");
}
/** Verified flag and trust score are derived, so an admin approval shows up everywhere at once. */
function resolveCaretaker(c) {
    const verified = c.verified || hasApproved(c.id, "caretaker");
    const theirs = rooms.filter((r) => r.caretakerId === c.id);
    const reportCount = reports.filter((rep) => theirs.some((r) => r.id === rep.roomId)).length;
    const { score } = computeTrust({ verified, rooms: theirs, reportCount, joinedAt: c.joinedAt });
    return { ...c, verified, trustScore: score };
}
const withCaretaker = (r) => ({
    ...r,
    caretaker: resolveCaretaker(caretakers.find((c) => c.id === r.caretakerId)),
});
export function minutesTo(r, campus) {
    const d = r.distances?.[campus];
    return d?.walkMin ?? d?.matatuMin ?? 999;
}
export async function getRooms(filters = {}) {
    await delay();
    let list = rooms.filter((r) => {
        if (r.hidden)
            return false;
        if (filters.area && r.area !== filters.area)
            return false;
        if (filters.roomType && r.roomType !== filters.roomType)
            return false;
        if (filters.minRent && r.rentKes < filters.minRent)
            return false;
        if (filters.maxRent && r.rentKes > filters.maxRent)
            return false;
        if (filters.vacantOnly && r.status !== "Vacant")
            return false;
        if (filters.amenities?.length && !filters.amenities.every((a) => r.amenities.includes(a)))
            return false;
        if (filters.near && minutesTo(r, filters.near) > 20)
            return false;
        return true;
    });
    const sort = filters.sort ?? "newest";
    list = [...list].sort((a, b) => {
        if (a.status !== b.status)
            return a.status === "Vacant" ? -1 : 1;
        if (sort === "rent_asc")
            return a.rentKes - b.rentKes;
        if (sort === "rent_desc")
            return b.rentKes - a.rentKes;
        return +new Date(b.lastConfirmedVacantAt) - +new Date(a.lastConfirmedVacantAt);
    });
    return list.map(withCaretaker);
}
export async function getRoom(id) {
    await delay(250);
    const r = rooms.find((x) => x.id === id);
    return r && !r.hidden ? withCaretaker(r) : null;
}
const savedKey = (userId) => `rommie.saved.${userId}`;
const readSaved = (userId) => store.get(savedKey(userId), []);
/** Ids of the signed-in person's saved rooms, newest first. Empty for visitors. */
export async function getSavedIds() {
    await delay(120);
    const u = getSession();
    return u ? readSaved(u.id) : [];
}
export async function saveRoom(id) {
    await delay(150);
    const u = requireUser();
    const cur = readSaved(u.id);
    if (!cur.includes(id))
        store.set(savedKey(u.id), [id, ...cur]);
}
export async function unsaveRoom(id) {
    await delay(150);
    const u = requireUser();
    store.set(savedKey(u.id), readSaved(u.id).filter((x) => x !== id));
}
export async function getSavedRooms() {
    await delay();
    const u = getSession();
    if (!u)
        return [];
    return readSaved(u.id)
        .map((id) => rooms.find((r) => r.id === id))
        .filter((r) => !!r && !r.hidden)
        .map(withCaretaker);
}
const alertsKey = (userId) => `rommie.alerts.${userId}`;
const readAlerts = (userId) => store.get(alertsKey(userId), []);
export async function createAlert(data) {
    await delay();
    const u = requireUser();
    const a = { ...data, id: uid(), active: true, createdAt: new Date().toISOString() };
    store.set(alertsKey(u.id), [a, ...readAlerts(u.id)]);
    return a;
}
export async function getAlerts() {
    await delay();
    const u = getSession();
    return u ? readAlerts(u.id) : [];
}
export async function updateAlert(id, data) {
    await delay(200);
    const u = requireUser();
    store.set(alertsKey(u.id), readAlerts(u.id).map((a) => (a.id === id ? { ...a, ...data } : a)));
}
export async function deleteAlert(id) {
    await delay(200);
    const u = requireUser();
    store.set(alertsKey(u.id), readAlerts(u.id).filter((a) => a.id !== id));
}
export async function createListing(data) {
    await delay(800);
    const r = { ...data, id: uid(), createdAt: new Date().toISOString() };
    rooms.unshift(r);
    return r;
}
export async function updateListing(id, data) {
    await delay();
    rooms = rooms.map((r) => (r.id === id ? { ...r, ...data } : r));
}
export async function setRoomStatus(id, status) {
    await delay(200);
    rooms = rooms.map((r) => r.id === id ? { ...r, status, ...(status === "Vacant" ? { lastConfirmedVacantAt: new Date().toISOString() } : {}) } : r);
}
/** Caretaker confirms the room is still vacant. Also lifts an admin "hidden" flag, since stale listings are what get hidden. */
export async function reconfirmRoom(id) {
    await setRoomStatus(id, "Vacant");
    rooms = rooms.map((r) => (r.id === id ? { ...r, hidden: false } : r));
}
export async function deleteListing(id) { await delay(300); rooms = rooms.filter((r) => r.id !== id); }
export async function getMyListings(caretakerId) {
    await delay();
    const owner = caretakerId ?? getSession()?.id;
    return rooms.filter((r) => r.caretakerId === owner);
}
/**
 * Mock photo upload. A real backend would return a CDN URL.
 * Mock rules so the UI error states can be exercised: non-images and files over 8 MB are rejected,
 * and a file whose name contains "fail" errors on its first attempt only (to try Retry).
 */
const failedOnce = new Set();
export async function uploadPhoto(file, onProgress) {
    if (!file.type.startsWith("image/"))
        throw new Error("That file isn't a photo.");
    if (file.size > 8 * 1024 * 1024)
        throw new Error("Photo is larger than 8 MB.");
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
        await delay(90);
        onProgress?.(Math.round((i / steps) * 100));
        if (i === 5 && /fail/i.test(file.name) && !failedOnce.has(file.name)) {
            failedOnce.add(file.name);
            throw new Error("Upload interrupted. Check your connection and retry.");
        }
    }
    return URL.createObjectURL(file);
}
export async function submitReport(roomId, reason, note) {
    await delay(700);
    reports.push({ id: uid(), roomId, reason, note, createdAt: new Date().toISOString() });
}
const DOC_MAX_BYTES = 8 * 1024 * 1024;
const readAsDataUrl = (file) => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error("Couldn't read the file."));
    fr.readAsDataURL(file);
});
/** Student ID / admission letter (kind "student") or caretaker ID (kind "caretaker"). Image or PDF, up to 8 MB. */
export async function submitVerification(kind, file) {
    const u = requireUser();
    if (!(file.type.startsWith("image/") || file.type === "application/pdf"))
        throw new Error("Upload a photo or a PDF.");
    if (file.size > DOC_MAX_BYTES)
        throw new Error("That file is larger than 8 MB.");
    if (getQueue().some((q) => q.userId === u.id && q.kind === kind && q.status === "pending")) {
        throw new Error("You already have a request waiting for review.");
    }
    await delay(800);
    // Small files are kept as data URLs so the preview survives a reload; larger ones fall back to a session-only link.
    const documentUrl = file.size <= 1.5 * 1024 * 1024 ? await readAsDataUrl(file) : URL.createObjectURL(file);
    const req = {
        id: uid(), kind, userId: u.id, name: u.name, phone: u.phone, documentUrl,
        documentName: file.name, documentMime: file.type,
        submittedAt: new Date().toISOString(), status: "pending",
    };
    setQueue([...getQueue(), req]);
    return req;
}
/** The signed-in person's latest request of this kind. Caretakers seeded as verified count as approved. */
export async function getMyVerification(kind) {
    await delay(250);
    const u = getSession();
    if (!u)
        return { status: "none" };
    const latest = getQueue()
        .filter((q) => q.userId === u.id && q.kind === kind)
        .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt))[0];
    if (kind === "student")
        refreshSession();
    if (latest)
        return { status: latest.status, request: latest };
    if (kind === "caretaker" && caretakers.find((c) => c.id === u.id)?.verified)
        return { status: "approved" };
    return { status: "none" };
}
/** Oldest first, so the longest wait is at the top. */
export async function getVerificationQueue() {
    await delay();
    return getQueue()
        .filter((q) => q.status === "pending")
        .sort((a, b) => +new Date(a.submittedAt) - +new Date(b.submittedAt));
}
export async function reviewVerification(id, decision, reason) {
    await delay();
    if (decision === "rejected" && !reason?.trim())
        throw new Error("Add a reason so they know what to fix.");
    setQueue(getQueue().map((q) => (q.id === id ? { ...q, status: decision, reason: decision === "rejected" ? reason.trim() : undefined } : q)));
}
export async function getCaretakerProfile(id) {
    await delay();
    const owner = id ?? requireUser().id;
    const base = caretakers.find((c) => c.id === owner);
    if (!base)
        throw new Error("Caretaker not found.");
    const mine = rooms.filter((r) => r.caretakerId === owner);
    const caretaker = resolveCaretaker(base);
    const reportCount = reports.filter((rep) => mine.some((r) => r.id === rep.roomId)).length;
    const trust = computeTrust({ verified: caretaker.verified, rooms: mine, reportCount, joinedAt: caretaker.joinedAt });
    const verification = await getMyVerification("caretaker");
    return { caretaker, rooms: mine, trust, verification };
}
export async function getAdminStats() {
    await delay();
    const live = rooms.filter((r) => !r.hidden);
    const stale = live.filter((r) => r.status === "Vacant" && daysSince(r.lastConfirmedVacantAt) >= STALE_DAYS);
    return {
        totalListings: live.length,
        vacancies: live.filter((r) => r.status === "Vacant").length,
        contactsMade: 128,
        staleListings: stale.length,
        openReports: reports.length,
        stale: stale.map(withCaretaker),
    };
}
/** Take a listing off the public site. The caretaker still sees it in My Listings. */
export async function hideListing(id) {
    await delay(250);
    rooms = rooms.map((r) => (r.id === id ? { ...r, hidden: true } : r));
}
/* ---------- Auth (mock) ---------- */
/* The session lives in memory + localStorage. A real backend would issue a token instead. */
export class AuthError extends Error {
    field;
    constructor(message, field) {
        super(message);
        this.name = "AuthError";
        this.field = field;
    }
}
const SESSION_KEY = "rommie.session";
const accounts = [...seedAccounts];
let session = null;
let sessionLoaded = false;
const sessionListeners = new Set();
function loadSession() {
    sessionLoaded = true;
    try {
        const raw = window.localStorage.getItem(SESSION_KEY);
        session = raw ? JSON.parse(raw) : null;
    }
    catch {
        session = null;
    }
}
function setSession(u) {
    session = u;
    sessionLoaded = true;
    try {
        if (u)
            window.localStorage.setItem(SESSION_KEY, JSON.stringify(u));
        else
            window.localStorage.removeItem(SESSION_KEY);
    }
    catch { /* storage unavailable: session stays in memory */ }
    sessionListeners.forEach((l) => l());
}
/** Synchronous read of the signed-in user (null on the server). Stable reference between changes. */
export function getSession() {
    if (typeof window === "undefined")
        return null;
    if (!sessionLoaded)
        loadSession();
    return session;
}
export function subscribeSession(listener) {
    sessionListeners.add(listener);
    const onStorage = (e) => {
        if (e.key === SESSION_KEY) {
            loadSession();
            listener();
        }
    };
    window.addEventListener("storage", onStorage);
    return () => {
        sessionListeners.delete(listener);
        window.removeEventListener("storage", onStorage);
    };
}
const toUser = ({ password: _p, ...u }) => ({ ...u, studentVerified: isStudentVerified(u.id, u.studentVerified) });
/** Re-derive the badge on the stored session (an admin may have approved the student since they logged in). */
export function refreshSession() {
    if (!session || session.role !== "student")
        return;
    const verified = isStudentVerified(session.id, accounts.find((a) => a.id === session.id)?.studentVerified);
    if (!!session.studentVerified !== verified)
        setSession({ ...session, studentVerified: verified });
}
export async function signUp(data) {
    await delay(700);
    if (accounts.some((a) => a.phone === data.phone)) {
        throw new AuthError("An account with this number already exists. Try logging in.", "phone");
    }
    const acct = { id: `${data.role === "caretaker" ? "c" : "u"}-${uid()}`, name: data.name, phone: data.phone, role: data.role, phoneVerified: false, password: data.password };
    accounts.push(acct);
    if (data.role === "caretaker") {
        caretakers.push({ id: acct.id, name: acct.name, phone: acct.phone, verified: false, trustScore: 50, joinedAt: new Date().toISOString() });
    }
    const user = toUser(acct);
    setSession(user);
    return user;
}
export async function login(data) {
    await delay(600);
    const acct = accounts.find((a) => a.phone === data.phone);
    if (!acct || acct.password !== data.password)
        throw new AuthError("Phone number or password is incorrect.", "password");
    const user = toUser(acct);
    setSession(user);
    return user;
}
/** Log in with a one-time code instead of a password (call sendOtp first). */
export async function loginWithOtp(phone, code) {
    const res = await verifyOtp(phone, code);
    if (!res.ok)
        throw new AuthError(otpMessage(res.reason), "code");
    const acct = accounts.find((a) => a.phone === phone);
    if (!acct)
        throw new AuthError("No account uses this number yet. Sign up first.", "phone");
    const user = { ...toUser(acct), phoneVerified: true };
    acct.phoneVerified = true;
    setSession(user);
    return user;
}
export async function logout() { await delay(100); setSession(null); }
export function otpMessage(reason) {
    return reason === "expired" ? "That code has expired. Request a new one." : "That code isn't right. Check it and try again.";
}
const OTP_TTL_MS = 5 * 60 * 1000;
const otpSentAt = new Map();
export async function sendOtp(phone) { await delay(500); otpSentAt.set(phone, Date.now()); return { sent: true }; }
/** Mock accepts 123456 while the code is fresh (5 minutes). Verifying also marks the signed-in phone as verified. */
export async function verifyOtp(phone, code) {
    await delay(500);
    const sent = otpSentAt.get(phone);
    if (sent === undefined || Date.now() - sent > OTP_TTL_MS)
        return { ok: false, reason: "expired" };
    if (code !== "123456")
        return { ok: false, reason: "wrong" };
    const acct = accounts.find((a) => a.phone === phone);
    if (acct)
        acct.phoneVerified = true;
    if (session && session.phone === phone)
        setSession({ ...session, phoneVerified: true });
    otpSentAt.delete(phone);
    return { ok: true };
}
export function daysSince(iso) {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
