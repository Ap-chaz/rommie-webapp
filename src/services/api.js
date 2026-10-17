/**
 * Rommie service layer. UI code calls ONLY these functions.
 * Replace the mock bodies with real HTTP calls when the backend is ready.
 */
import { accounts as seedAccounts, caretakers, rooms as seedRooms, seedReports, seedVerificationRequests } from "@/data/mockData";
import { formatKes, genderMatches, STALE_DAYS } from "@/lib/format";
import { computeTrust } from "@/lib/trust";
import { getSettings, saveSettings, validateSettings } from "@/lib/settings";
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
let rooms = [...seedRooms];
const reports = seedReports.map((r) => ({ ...r }));
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
function requireAdmin() {
    const u = requireUser();
    if (u.role !== "admin")
        throw new Error("Admins only.");
    return u;
}
/* ---------- Suspended caretakers ---------- */
const SUSPENDED_KEY = "rommie.suspended";
let suspendedCache = null;
const suspendedSet = () => (suspendedCache ??= new Set(store.get(SUSPENDED_KEY, [])));
const SUSPENDED_MESSAGE = "This account is suspended. Contact Rommie to get it restored.";
const isSuspended = (caretakerId) => suspendedSet().has(caretakerId);
/* ---------- Contact taps (WhatsApp / Call) ---------- */
const CONTACTS_KEY = "rommie.contacts";
const MAX_CONTACT_EVENTS = 2000;
const CONTACT_DEDUPE_MS = 30000;
let contactsCache = null;
const readContacts = () => (contactsCache ??= store.get(CONTACTS_KEY, []));
/**
 * Count a student tapping WhatsApp or Call on a listing. Fire and forget: it never throws or blocks the tap.
 * Skipped for admins and for the listing's own caretaker, and a repeat tap on the same listing and channel
 * within 30 seconds counts once, so the dashboard number reflects real interest, not double taps.
 */
export function trackContact(roomId, channel) {
    try {
        if (channel !== "whatsapp" && channel !== "call")
            return;
        const room = rooms.find((r) => r.id === roomId);
        if (!room)
            return;
        const u = getSession();
        if (u && (u.role === "admin" || u.id === room.caretakerId))
            return;
        const now = Date.now();
        const list = readContacts();
        if (list.some((e) => e.roomId === roomId && e.channel === channel && now - +new Date(e.at) < CONTACT_DEDUPE_MS))
            return;
        contactsCache = [{ id: uid(), roomId, channel, at: new Date(now).toISOString(), ...(u ? { userId: u.id } : {}) }, ...list].slice(0, MAX_CONTACT_EVENTS);
        store.set(CONTACTS_KEY, contactsCache);
    }
    catch { /* tracking must never get in the way of the contact itself */ }
}
/** Contact taps on listings that still exist. */
const liveContacts = () => readContacts().filter((e) => rooms.some((r) => r.id === e.roomId));
/* ---------- Admin activity log (kept in localStorage, newest first) ---------- */
const ACTIVITY_KEY = "rommie.activity";
const MAX_ACTIVITY = 500;
let activityCache = null;
const activityLog = () => (activityCache ??= store.get(ACTIVITY_KEY, []));
/** Record who did what. The actor is the signed-in person, or "Admin" when an action runs without a session. */
function logAction(action, summary, target) {
    const u = getSession();
    const entry = { id: uid(), at: new Date().toISOString(), actorId: u?.id ?? "system", actor: u?.name ?? "Admin", action, summary, ...(target ? { target } : {}) };
    activityCache = [entry, ...activityLog()].slice(0, MAX_ACTIVITY);
    store.set(ACTIVITY_KEY, activityCache);
}
export async function getActivity(limit = 200) {
    await delay(150);
    requireAdmin();
    return activityLog().slice(0, limit);
}
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
        if (r.hidden || isSuspended(r.caretakerId))
            return false;
        if (filters.area && r.area !== filters.area)
            return false;
        if (filters.roomType && r.roomType !== filters.roomType)
            return false;
        if (filters.minRent && r.rentKes < filters.minRent)
            return false;
        if (filters.maxRent && r.rentKes > filters.maxRent)
            return false;
        if (!genderMatches(r, filters.gender))
            return false;
        if (filters.mealsOnly && r.meals !== "available")
            return false;
        if (filters.transportOnly && !r.transport)
            return false;
        if (filters.vacantOnly && r.status !== "Vacant")
            return false;
        if (filters.amenities?.length && !filters.amenities.every((a) => r.amenities.includes(a)))
            return false;
        if (filters.near && !(r.inGuide && (!r.nearCampus || r.nearCampus === filters.near)) && minutesTo(r, filters.near) > 20)
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
    return r && !r.hidden && !isSuspended(r.caretakerId) ? withCaretaker(r) : null;
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
        .filter((r) => !!r && !r.hidden && !isSuspended(r.caretakerId))
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
/** Other visible listings in the same building (same buildingId), so students can see every room type on offer. */
export async function getBuildingRooms(buildingId, excludeId) {
    await delay(150);
    return rooms.filter((r) => r.buildingId === buildingId && r.id !== excludeId && !r.hidden && !isSuspended(r.caretakerId)).map(withCaretaker);
}
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
    reports.push({ id: uid(), roomId, reason, note, status: "open", createdAt: new Date().toISOString() });
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
    const req = getQueue().find((q) => q.id === id);
    const admin = getSession()?.role === "admin" ? getSession() : null;
    setQueue(getQueue().map((q) => (q.id === id ? { ...q, status: decision, reason: decision === "rejected" ? reason.trim() : undefined, reviewedAt: new Date().toISOString(), reviewedBy: admin?.name ?? "Admin" } : q)));
    if (req)
        logAction(decision === "approved" ? "verification.approved" : "verification.rejected", `${decision === "approved" ? "Approved" : "Rejected"} ${req.kind} verification for ${req.name}`, { userId: req.userId });
}
/** Decisions already made, newest first, so a mistake can be undone. */
export async function getVerificationHistory() {
    await delay();
    requireAdmin();
    return getQueue()
        .filter((q) => q.status !== "pending")
        .sort((a, b) => +new Date(b.reviewedAt ?? b.submittedAt) - +new Date(a.reviewedAt ?? a.submittedAt));
}
/** Put a reviewed request back in the queue. An approved badge disappears until it is approved again. */
export async function undoVerificationReview(id) {
    await delay();
    requireAdmin();
    const req = getQueue().find((q) => q.id === id);
    if (!req || req.status === "pending")
        throw new Error("That request is already waiting for review.");
    setQueue(getQueue().map((q) => (q.id === id ? { ...q, status: "pending", reason: undefined, reviewedAt: undefined, reviewedBy: undefined } : q)));
    logAction("verification.undone", `Moved ${req.name}'s ${req.kind} verification back to the queue`, { userId: req.userId });
    refreshSession();
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
const isOpen = (rep) => (rep.status ?? "open") === "open";
export async function getAdminStats() {
    await delay();
    const live = rooms.filter((r) => !r.hidden && !isSuspended(r.caretakerId));
    const stale = live.filter((r) => r.status === "Vacant" && daysSince(r.lastConfirmedVacantAt) >= STALE_DAYS);
    return {
        totalListings: live.length,
        vacancies: live.filter((r) => r.status === "Vacant").length,
        contactsMade: liveContacts().length,
        staleListings: stale.length,
        openReports: reports.filter(isOpen).length,
        hiddenListings: rooms.filter((r) => r.hidden).length,
        stale: stale.map(withCaretaker),
    };
}
/** Take a listing off the public site. The caretaker still sees it in My Listings. */
export async function hideListing(id) {
    await delay(250);
    const room = rooms.find((r) => r.id === id);
    rooms = rooms.map((r) => (r.id === id ? { ...r, hidden: true } : r));
    if (room)
        logAction("listing.hidden", `Hid "${room.title}"`, { roomId: id });
}
/** Every listing an admin (or the stale check) has taken off the public site. */
export async function getHiddenListings() {
    await delay();
    requireAdmin();
    return rooms.filter((r) => r.hidden).map(withCaretaker);
}
/** Put a hidden listing back on the public site. If it is stale it shows "Needs reconfirming" until the caretaker confirms. */
export async function restoreListing(id) {
    await delay(250);
    requireAdmin();
    const room = rooms.find((r) => r.id === id);
    if (!room)
        throw new Error("Listing not found.");
    if (!room.hidden)
        throw new Error("That listing isn't hidden.");
    rooms = rooms.map((r) => (r.id === id ? { ...r, hidden: false } : r));
    logAction("listing.restored", `Restored "${room.title}"`, { roomId: id });
}
/* ---------- Listings manager ---------- */
/** Every listing, hidden ones included, newest first. Filtering happens in the page (see lib/adminFilters). */
export async function getAdminListings() {
    await delay();
    requireAdmin();
    const counts = new Map();
    for (const e of liveContacts())
        counts.set(e.roomId, (counts.get(e.roomId) ?? 0) + 1);
    return [...rooms].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).map((r) => ({ ...withCaretaker(r), contactCount: counts.get(r.id) ?? 0 }));
}
/** Fix a bad title, description or price. Hostel rent comes from the room options, so it can't be edited here. */
export async function adminUpdateListing(id, data) {
    await delay(300);
    requireAdmin();
    const room = rooms.find((r) => r.id === id);
    if (!room)
        throw new Error("Listing not found.");
    const patch = {};
    const changes = [];
    if (data.title !== undefined) {
        const title = data.title.trim();
        if (title.length < 5 || title.length > 80)
            throw new Error("The title must be 5 to 80 characters.");
        if (title !== room.title) {
            patch.title = title;
            changes.push("title");
        }
    }
    if (data.description !== undefined) {
        const description = data.description.trim();
        if (description.length > 600)
            throw new Error("Keep the description under 600 characters.");
        if (description !== room.description) {
            patch.description = description;
            changes.push("description");
        }
    }
    if (data.rentKes !== undefined && data.rentKes !== room.rentKes) {
        if (room.roomOptions?.length)
            throw new Error("Rent for hostels comes from the room options. Ask the caretaker to edit those.");
        if (!Number.isInteger(data.rentKes) || data.rentKes <= 0 || data.rentKes > 500000)
            throw new Error("Enter the rent in whole shillings, up to 500,000.");
        patch.rentKes = data.rentKes;
        changes.push(`rent from ${formatKes(room.rentKes)} to ${formatKes(data.rentKes)}`);
    }
    if (changes.length === 0)
        return;
    rooms = rooms.map((r) => (r.id === id ? { ...r, ...patch } : r));
    logAction("listing.edited", `Edited "${room.title}": ${changes.join(", ")}`, { roomId: id });
}
/** Remove a listing for good (spam, duplicates). Open reports about it are closed. */
export async function adminDeleteListing(id) {
    await delay(300);
    const admin = requireAdmin();
    const room = rooms.find((r) => r.id === id);
    if (!room)
        throw new Error("Listing not found.");
    rooms = rooms.filter((r) => r.id !== id);
    for (const r of reports)
        if (r.roomId === id && isOpen(r))
            Object.assign(r, { status: "resolved", action: "deleted", handledAt: new Date().toISOString(), handledBy: admin.name });
    logAction("listing.deleted", `Deleted "${room.title}"`, { roomId: id });
}
/* ---------- Reports ---------- */
/** "open" reports waiting for a decision, or "handled" ones (resolved or dismissed), newest first. */
/** Everyone on the platform except admins. Caretakers include hostels, which have no login yet. */
export async function getAdminUsers() {
    await delay();
    requireAdmin();
    const caretakerRows = caretakers.map((c) => {
        const r = resolveCaretaker(c);
        const theirs = rooms.filter((x) => x.caretakerId === c.id);
        return {
            id: c.id, name: c.name, phone: c.phone, verified: r.verified, trustScore: r.trustScore, joinedAt: c.joinedAt,
            listingCount: theirs.length, openReports: reports.filter((rep) => isOpen(rep) && theirs.some((x) => x.id === rep.roomId)).length,
            suspended: isSuspended(c.id), isHostel: c.id.startsWith("hc-"), hasAccount: accounts.some((a) => a.id === c.id),
        };
    });
    const studentRows = new Map();
    for (const a of accounts.filter((x) => x.role === "student"))
        studentRows.set(a.id, { id: a.id, name: a.name, phone: a.phone, verified: isStudentVerified(a.id, a.studentVerified), hasAccount: true });
    for (const q of getQueue().filter((x) => x.kind === "student" && !studentRows.has(x.userId)))
        studentRows.set(q.userId, { id: q.userId, name: q.name, phone: q.phone, verified: hasApproved(q.userId, "student"), hasAccount: false });
    return { caretakers: caretakerRows, students: [...studentRows.values()] };
}
/** Suspended caretakers cannot log in and their listings leave the public site until restored. */
export async function setCaretakerSuspended(id, suspended) {
    await delay();
    requireAdmin();
    const c = caretakers.find((x) => x.id === id);
    if (!c)
        throw new Error("Caretaker not found.");
    const set = suspendedSet();
    if (suspended === set.has(id))
        return;
    if (suspended)
        set.add(id);
    else
        set.delete(id);
    store.set(SUSPENDED_KEY, [...set]);
    logAction(suspended ? "caretaker.suspended" : "caretaker.restored", `${suspended ? "Suspended" : "Restored"} ${c.name}`, { userId: id });
}
/** Contact details shown in the footer and help pages. Anyone can read them; only admins change them. */
export async function updateSiteSettings(input) {
    await delay();
    requireAdmin();
    const res = validateSettings(input);
    if (res.errors) {
        const field = Object.keys(res.errors)[0];
        const err = new Error(res.errors[field]);
        err.field = field;
        err.errors = res.errors;
        throw err;
    }
    const before = getSettings();
    const changed = Object.keys(res.values).filter((k) => before[k] !== res.values[k]);
    if (changed.length === 0)
        return before;
    saveSettings(res.values);
    logAction("settings.updated", `Changed site contact details: ${changed.join(", ")}`);
    return getSettings();
}
const DAY_MS = 86400000;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
/** Numbers for the analytics page. Contacts are real taps; listings and caretaker sign-ups come from the mock data. */
export async function getAdminAnalytics() {
    await delay();
    requireAdmin();
    const live = rooms.filter((r) => !r.hidden && !isSuspended(r.caretakerId));
    const count = (keyFn) => {
        const m = new Map();
        for (const r of live) {
            const k = keyFn(r);
            const row = m.get(k) ?? { key: k, total: 0, vacant: 0 };
            row.total += 1;
            if (r.status === "Vacant")
                row.vacant += 1;
            m.set(k, row);
        }
        return [...m.values()].sort((a, b) => b.total - a.total);
    };
    const events = liveContacts();
    const today = Date.now();
    const contactsByDay = Array.from({ length: 14 }, (_, i) => {
        const key = dayKey(today - (13 - i) * DAY_MS);
        return { key, count: events.filter((e) => dayKey(e.at) === key).length };
    });
    const perRoom = new Map();
    for (const e of events)
        perRoom.set(e.roomId, (perRoom.get(e.roomId) ?? 0) + 1);
    const topListings = [...perRoom.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, n]) => ({ id, title: rooms.find((r) => r.id === id)?.title ?? id, count: n }));
    const weeks = Array.from({ length: 8 }, (_, i) => {
        const end = today - (7 - i) * 7 * DAY_MS;
        const start = end - 7 * DAY_MS;
        return { key: dayKey(end), count: caretakers.filter((c) => { const t = +new Date(c.joinedAt); return t > start && t <= end; }).length };
    });
    return {
        byArea: count((r) => r.area),
        byType: count((r) => r.roomType),
        vacancyRate: live.length ? Math.round((live.filter((r) => r.status === "Vacant").length / live.length) * 100) : 0,
        contactsByDay,
        contactsTotal: events.length,
        topListings,
        caretakerSignups: weeks,
    };
}
export async function getReports(which = "open") {
    await delay();
    requireAdmin();
    return reports
        .filter((r) => (which === "open" ? isOpen(r) : !isOpen(r)))
        .sort((a, b) => +new Date(b.handledAt ?? b.createdAt) - +new Date(a.handledAt ?? a.createdAt))
        .map((rep) => {
        const room = rooms.find((x) => x.id === rep.roomId);
        return {
            ...rep,
            status: rep.status ?? "open",
            room: room ? withCaretaker(room) : null,
            openOnRoom: reports.filter((x) => x.roomId === rep.roomId && isOpen(x)).length,
        };
    });
}
/**
 * Decide an open report. "dismissed" = nothing wrong, "resolved" = handled elsewhere (e.g. the caretaker fixed it),
 * "hidden" = take the listing off the public site, which also closes every other open report about it.
 */
export async function reviewReport(id, decision) {
    await delay(250);
    const admin = requireAdmin();
    if (!["dismissed", "resolved", "hidden"].includes(decision))
        throw new Error("Unknown decision.");
    const rep = reports.find((r) => r.id === id);
    if (!rep)
        throw new Error("Report not found.");
    if (!isOpen(rep))
        throw new Error("That report was already handled.");
    const room = rooms.find((r) => r.id === rep.roomId);
    const handled = { handledAt: new Date().toISOString(), handledBy: admin.name };
    if (decision === "hidden") {
        rooms = rooms.map((r) => (r.id === rep.roomId ? { ...r, hidden: true } : r));
        for (const r of reports)
            if (r.roomId === rep.roomId && isOpen(r))
                Object.assign(r, { status: "resolved", action: "hidden", ...handled });
        logAction("listing.hidden", `Hid "${room?.title ?? rep.roomId}" after a "${rep.reason}" report`, { roomId: rep.roomId, reportId: id });
        return;
    }
    Object.assign(rep, { status: decision, action: decision, ...handled });
    logAction(decision === "dismissed" ? "report.dismissed" : "report.resolved", `${decision === "dismissed" ? "Dismissed" : "Resolved"} a "${rep.reason}" report on "${room?.title ?? rep.roomId}"`, { roomId: rep.roomId, reportId: id });
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
    if (acct.role === "caretaker" && isSuspended(acct.id))
        throw new AuthError(SUSPENDED_MESSAGE, "password");
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
    if (acct.role === "caretaker" && isSuspended(acct.id))
        throw new AuthError(SUSPENDED_MESSAGE, "code");
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
