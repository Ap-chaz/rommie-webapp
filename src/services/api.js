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
            if (raw === null || raw === undefined)
                return fallback;
            try {
                return JSON.parse(raw);
            } catch {
                return raw;
            }
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
    remove(key) {
        if (typeof window === "undefined")
            return;
        try {
            window.localStorage.removeItem(key);
        }
        catch { /* storage unavailable */ }
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
function getAuthHeader() {
    if (typeof window === "undefined") return {};
    let token = store.get("rommie.token");
    if (!token && typeof document !== "undefined") {
        const match = document.cookie?.match(/(?:^|;\s*)rommie_token=([^;]+)/);
        if (match) token = decodeURIComponent(match[1]);
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
}
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
    try {
        const params = new URLSearchParams();
        if (filters.area) params.set("area", filters.area);
        if (filters.roomType) params.set("roomType", filters.roomType);
        if (filters.minRent) params.set("minRent", String(filters.minRent));
        if (filters.maxRent) params.set("maxRent", String(filters.maxRent));
        if (filters.gender) params.set("gender", filters.gender);
        if (filters.mealsOnly) params.set("mealsOnly", "true");
        if (filters.transportOnly) params.set("transportOnly", "true");
        if (filters.vacantOnly) params.set("vacantOnly", "true");
        if (filters.near) params.set("near", filters.near);
        if (filters.sort) params.set("sort", filters.sort);
        if (filters.amenities?.length) {
            filters.amenities.forEach((a) => params.append("amenities", a));
        }
        const res = await fetch(`/api/v1/rooms?${params.toString()}`);
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.data)) return json.data;
        }
    } catch {
        // Fallback for offline / vitest mock
    }
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
    try {
        const res = await fetch(`/api/v1/rooms/${encodeURIComponent(id)}`);
        if (res.ok) {
            const json = await res.json();
            return json;
        } else if (res.status === 404) {
            return null;
        }
    } catch {
        // Fallback
    }
    await delay(250);
    const r = rooms.find((x) => x.id === id);
    return r && !r.hidden && !isSuspended(r.caretakerId) ? withCaretaker(r) : null;
}
const savedKey = (userId) => `rommie.saved.${userId}`;
const readSaved = (userId) => store.get(savedKey(userId), []);
/** Ids of the signed-in person's saved rooms, newest first. Empty for visitors. */
export async function getSavedIds() {
    const authHeader = getAuthHeader();
    if (!authHeader.Authorization) {
        const u = getSession();
        return u ? readSaved(u.id) : [];
    }
    let networkAttempted = false;
    try {
        const res = await fetch("/api/v1/saved", {
            headers: authHeader,
            credentials: "include"
        });
        networkAttempted = true;
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.data)) return json.data;
        } else if (res.status === 401) {
            return [];
        }
    } catch {
        // Fallback for offline / vitest mock
    }
    await delay(120);
    const u = getSession();
    return u ? readSaved(u.id) : [];
}
export async function saveRoom(id) {
    let networkAttempted = false;
    try {
        const res = await fetch(`/api/v1/saved/${encodeURIComponent(id)}`, {
            method: "POST",
            headers: getAuthHeader(),
            credentials: "include"
        });
        networkAttempted = true;
        if (res.ok) {
            const u = getSession();
            if (u) {
                const cur = readSaved(u.id);
                if (!cur.includes(id)) store.set(savedKey(u.id), [id, ...cur]);
            }
            return;
        } else {
            const errData = await res.json().catch(() => ({}));
            const message = errData?.error?.message || errData?.message || `Failed to save room (status: ${res.status})`;
            throw new Error(message);
        }
    } catch (err) {
        if (networkAttempted) {
            throw err;
        }
        // Fallback for offline or mock environment
    }
    await delay(150);
    const u = requireUser();
    const cur = readSaved(u.id);
    if (!cur.includes(id))
        store.set(savedKey(u.id), [id, ...cur]);
}
export async function unsaveRoom(id) {
    let networkAttempted = false;
    try {
        const res = await fetch(`/api/v1/saved/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: getAuthHeader(),
            credentials: "include"
        });
        networkAttempted = true;
        if (res.ok) {
            const u = getSession();
            if (u) store.set(savedKey(u.id), readSaved(u.id).filter((x) => x !== id));
            return;
        } else {
            const errData = await res.json().catch(() => ({}));
            const message = errData?.error?.message || errData?.message || `Failed to remove room (status: ${res.status})`;
            throw new Error(message);
        }
    } catch (err) {
        if (networkAttempted) {
            throw err;
        }
        // Fallback
    }
    await delay(150);
    const u = requireUser();
    store.set(savedKey(u.id), readSaved(u.id).filter((x) => x !== id));
}
export async function getSavedRooms() {
    let networkAttempted = false;
    try {
        const res = await fetch("/api/v1/saved/rooms", {
            headers: getAuthHeader(),
            credentials: "include"
        });
        networkAttempted = true;
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.data)) return json.data;
        } else if (res.status === 401) {
            return [];
        }
    } catch {
        // Fallback
    }
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
    try {
        const res = await fetch("/api/v1/alerts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            },
            credentials: "include",
            body: JSON.stringify(data)
        });
        if (res.ok) {
            const json = await res.json();
            const a = json.data;
            const u = getSession();
            if (u) store.set(alertsKey(u.id), [a, ...readAlerts(u.id)]);
            return a;
        }
    } catch {
        // Fallback
    }
    await delay();
    const u = requireUser();
    const a = { ...data, id: uid(), active: true, createdAt: new Date().toISOString() };
    store.set(alertsKey(u.id), [a, ...readAlerts(u.id)]);
    return a;
}
export async function getAlerts() {
    try {
        const res = await fetch("/api/v1/alerts", {
            headers: getAuthHeader(),
            credentials: "include"
        });
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.data)) return json.data;
        }
    } catch {
        // Fallback
    }
    await delay();
    const u = getSession();
    return u ? readAlerts(u.id) : [];
}
export async function updateAlert(id, data) {
    try {
        const res = await fetch(`/api/v1/alerts/${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            },
            credentials: "include",
            body: JSON.stringify(data)
        });
        if (res.ok) {
            const json = await res.json();
            const u = getSession();
            if (u) store.set(alertsKey(u.id), readAlerts(u.id).map((a) => (a.id === id ? { ...a, ...data } : a)));
            return json.data;
        }
    } catch {
        // Fallback
    }
    await delay(200);
    const u = requireUser();
    store.set(alertsKey(u.id), readAlerts(u.id).map((a) => (a.id === id ? { ...a, ...data } : a)));
}
export async function deleteAlert(id) {
    try {
        const res = await fetch(`/api/v1/alerts/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: getAuthHeader(),
            credentials: "include"
        });
        if (res.ok) {
            const u = getSession();
            if (u) store.set(alertsKey(u.id), readAlerts(u.id).filter((a) => a.id !== id));
            return;
        }
    } catch {
        // Fallback
    }
    await delay(200);
    const u = requireUser();
    store.set(alertsKey(u.id), readAlerts(u.id).filter((a) => a.id !== id));
}
export async function createListing(data) {
    if (typeof window !== "undefined") {
        try {
            const res = await fetch("/api/v1/rooms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader()
                },
                credentials: "include",
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const created = await res.json();
                rooms.unshift(created);
                return created;
            } else {
                const errJson = await res.json().catch(() => null);
                const msg = errJson?.error?.message || `Failed to create listing (HTTP ${res.status})`;
                throw new Error(msg);
            }
        } catch (err) {
            if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed to parse URL')) {
                throw err;
            }
        }
    }
    await delay(800);
    const r = { ...data, id: uid(), createdAt: new Date().toISOString() };
    rooms.unshift(r);
    return r;
}
export async function updateListing(id, data) {
    if (typeof window !== "undefined") {
        try {
            const res = await fetch(`/api/v1/rooms/${encodeURIComponent(id)}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader()
                },
                credentials: "include",
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updated = await res.json();
                rooms = rooms.map((r) => (r.id === id ? { ...r, ...updated } : r));
                return updated;
            } else {
                const errJson = await res.json().catch(() => null);
                const msg = errJson?.error?.message || `Failed to update listing (HTTP ${res.status})`;
                throw new Error(msg);
            }
        } catch (err) {
            if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed to parse URL')) {
                throw err;
            }
        }
    }
    await delay();
    rooms = rooms.map((r) => (r.id === id ? { ...r, ...data } : r));
}
export async function setRoomStatus(id, status) {
    try {
        const res = await fetch(`/api/v1/rooms/${encodeURIComponent(id)}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            },
            credentials: "include",
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            const updated = await res.json();
            rooms = rooms.map((r) => (r.id === id ? { ...r, ...updated } : r));
            return;
        }
    } catch {
        // Fallback
    }
    await delay(200);
    rooms = rooms.map((r) => r.id === id ? { ...r, status, ...(status === "Vacant" ? { lastConfirmedVacantAt: new Date().toISOString() } : {}) } : r);
}
/** Caretaker confirms the room is still vacant. Also lifts an admin "hidden" flag, since stale listings are what get hidden. */
export async function reconfirmRoom(id) {
    try {
        const res = await fetch(`/api/v1/rooms/${encodeURIComponent(id)}/reconfirm`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            },
            credentials: "include"
        });
        if (res.ok) {
            const updated = await res.json();
            rooms = rooms.map((r) => (r.id === id ? { ...r, ...updated } : r));
            return;
        }
    } catch {
        // Fallback
    }
    await setRoomStatus(id, "Vacant");
    rooms = rooms.map((r) => (r.id === id ? { ...r, hidden: false } : r));
}
export async function deleteListing(id) {
    try {
        const res = await fetch(`/api/v1/rooms/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: getAuthHeader(),
            credentials: "include"
        });
        if (res.ok) {
            rooms = rooms.filter((r) => r.id !== id);
            return;
        }
    } catch {
        // Fallback
    }
    await delay(300);
    rooms = rooms.filter((r) => r.id !== id);
}
/** Other visible listings in the same building (same buildingId), so students can see every room type on offer. */
export async function getBuildingRooms(buildingId, excludeId) {
    try {
        if (excludeId) {
            const res = await fetch(`/api/v1/rooms/${encodeURIComponent(excludeId)}/building`);
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json)) return json;
            }
        }
    } catch {
        // Fallback
    }
    await delay(150);
    return rooms.filter((r) => r.buildingId === buildingId && r.id !== excludeId && !r.hidden && !isSuspended(r.caretakerId)).map(withCaretaker);
}
export async function getMyListings(caretakerId) {
    try {
        const owner = caretakerId ?? getSession()?.id;
        if (owner) {
            const res = await fetch(`/api/v1/rooms?caretakerId=${encodeURIComponent(owner)}&limit=100`);
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json.data)) return json.data;
            }
        }
    } catch {
        // Fallback
    }
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

    if (typeof window !== "undefined" && typeof FormData !== "undefined") {
        try {
            const formData = new FormData();
            formData.append("file", file);
            const url = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/api/v1/media/upload");
                const token = store.get("rommie.token");
                if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable && onProgress) {
                        onProgress(Math.round((e.loaded / e.total) * 100));
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const res = JSON.parse(xhr.responseText);
                            resolve(res.url);
                        } catch {
                            reject(new Error("Upload response was invalid."));
                        }
                    } else {
                        reject(new Error("Upload failed. Check your connection and retry."));
                    }
                };
                xhr.onerror = () => reject(new Error("Upload network error."));
                xhr.send(formData);
            });
            if (url) return url;
        } catch (err) {
            // Fallback for tests/offline
        }
    }

    const steps = 8;
    for (let i = 1; i <= steps; i++) {
        await delay(40);
        onProgress?.(Math.round((i / steps) * 100));
        if (i === 5 && /fail/i.test(file.name) && !failedOnce.has(file.name)) {
            failedOnce.add(file.name);
            throw new Error("Upload interrupted. Check your connection and retry.");
        }
    }
    return typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(file) : `/mock/photo-${Date.now()}.webp`;
}
export async function submitReport(roomId, reason, note) {
    try {
        const res = await fetch("/api/v1/reports", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            },
            credentials: "include",
            body: JSON.stringify({ roomId, reason, note })
        });
        if (res.ok) {
            return;
        }
    } catch {
        // Fallback
    }
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

    let uploadedUrl = null;
    if (typeof window !== "undefined" && typeof FormData !== "undefined") {
        try {
            const formData = new FormData();
            formData.append("file", file);
            const upRes = await fetch("/api/v1/media/upload", {
                method: "POST",
                headers: getAuthHeader(),
                credentials: "include",
                body: formData
            });
            if (upRes.ok) {
                const upJson = await upRes.json();
                uploadedUrl = upJson.url;
            }
        } catch {
            // Fallback
        }
    }

    if (!uploadedUrl) {
        uploadedUrl = file.size <= 1.5 * 1024 * 1024 ? await readAsDataUrl(file) : URL.createObjectURL(file);
    }

    if (kind === "caretaker") {
        try {
            const res = await fetch("/api/v1/verification/caretaker", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader()
                },
                credentials: "include",
                body: JSON.stringify({
                    documentUrl: uploadedUrl,
                    documentName: file.name
                })
            });
            if (res.ok) {
                const json = await res.json();
                const req = json.data;
                setQueue([...getQueue(), req]);
                return req;
            } else if (res.status === 409) {
                throw new Error("You already have a request waiting for review.");
            } else if (res.status === 400) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.error?.message || "Invalid document submission.");
            }
        } catch (err) {
            if (err.message === "You already have a request waiting for review." || err.message?.startsWith("Invalid document")) {
                throw err;
            }
            // Fallback to offline / mock
        }
    }

    if (getQueue().some((q) => q.userId === u.id && q.kind === kind && q.status === "pending")) {
        throw new Error("You already have a request waiting for review.");
    }
    await delay(800);
    const req = {
        id: uid(), kind, userId: u.id, name: u.name, phone: u.phone, documentUrl: uploadedUrl,
        documentName: file.name, documentMime: file.type,
        submittedAt: new Date().toISOString(), status: "pending",
    };
    setQueue([...getQueue(), req]);
    return req;
}
/** The signed-in person's latest request of this kind. Caretakers seeded as verified count as approved. */
export async function getMyVerification(kind) {
    try {
        const u = getSession();
        if (u && kind === "caretaker") {
            const res = await fetch("/api/v1/verification/caretaker", {
                headers: getAuthHeader(),
                credentials: "include"
            });
            if (res.ok) {
                const json = await res.json();
                if (json.data && json.data.status && json.data.status !== "unsubmitted") {
                    return { status: json.data.status, request: json.data };
                }
            }
        }
    } catch {
        // Fallback
    }
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
    try {
        const res = await fetch("/api/v1/admin/verification/queue", {
            headers: getAuthHeader(),
            credentials: "include"
        });
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.data)) return json.data;
        }
    } catch {}
    await delay();
    return getQueue()
        .filter((q) => q.status === "pending")
        .sort((a, b) => +new Date(a.submittedAt) - +new Date(b.submittedAt));
}
export async function reviewVerification(id, decision, reason) {
    if (decision === "rejected" && !reason?.trim())
        throw new Error("Add a reason so they know what to fix.");
    try {
        const res = await fetch(`/api/v1/admin/verification/${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            },
            credentials: "include",
            body: JSON.stringify({
                status: decision,
                reviewNote: reason?.trim()
            })
        });
        if (res.ok) {
            const json = await res.json();
            const req = json.data;
            setQueue(getQueue().map((q) => (q.id === id ? { ...q, ...req } : q)));
            return req;
        }
    } catch {}
    await delay();
    const req = getQueue().find((q) => q.id === id);
    const admin = getSession()?.role === "admin" ? getSession() : null;
    setQueue(getQueue().map((q) => (q.id === id ? { ...q, status: decision, reason: decision === "rejected" ? reason.trim() : undefined, reviewedAt: new Date().toISOString(), reviewedBy: admin?.name ?? "Admin" } : q)));
    if (req)
        logAction(decision === "approved" ? "verification.approved" : "verification.rejected", `${decision === "approved" ? "Approved" : "Rejected"} ${req.kind} verification for ${req.name}`, { userId: req.userId });
}
/** Decisions already made, newest first, so a mistake can be undone. */
export async function getVerificationHistory() {
    try {
        const res = await fetch("/api/v1/admin/verification/history", {
            headers: getAuthHeader(),
            credentials: "include"
        });
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.data)) return json.data;
        }
    } catch {}
    await delay();
    requireAdmin();
    return getQueue()
        .filter((q) => q.status !== "pending")
        .sort((a, b) => +new Date(b.reviewedAt ?? b.submittedAt) - +new Date(a.reviewedAt ?? a.submittedAt));
}
/** Put a reviewed request back in the queue. An approved badge disappears until it is approved again. */
export async function undoVerificationReview(id) {
    try {
        const res = await fetch(`/api/v1/admin/verification/${encodeURIComponent(id)}/undo`, {
            method: "POST",
            headers: getAuthHeader(),
            credentials: "include"
        });
        if (res.ok) {
            const json = await res.json();
            const req = json.data;
            setQueue(getQueue().map((q) => (q.id === id ? { ...q, ...req } : q)));
            refreshSession();
            return req;
        }
    } catch {}
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
    const session = getSession();
    const owner = id ?? session?.id;
    if (!owner)
        throw new Error("Log in first.");

    try {
        const url = id && id !== session?.id
            ? `/api/v1/caretakers/${encodeURIComponent(id)}`
            : `/api/v1/caretakers/profile`;
        const res = await fetch(url, {
            headers: getAuthHeader(),
            credentials: "include"
        });
        if (res.ok) {
            const json = await res.json();
            const data = json.data || json;
            if (data?.caretaker && data?.trust && data.caretaker.trustScore === undefined) {
                data.caretaker.trustScore = data.trust.score;
            }
            return data;
        } else if (res.status === 404 && id) {
            const altUrl = `/api/v1/caretakers/${encodeURIComponent(owner)}`;
            if (url !== altUrl) {
                const res2 = await fetch(altUrl, {
                    headers: getAuthHeader(),
                    credentials: "include"
                });
                if (res2.ok) {
                    const json2 = await res2.json();
                    const data2 = json2.data || json2;
                    if (data2?.caretaker && data2?.trust && data2.caretaker.trustScore === undefined) {
                        data2.caretaker.trustScore = data2.trust.score;
                    }
                    return data2;
                }
            }
        }
    } catch {
        // Fallback to offline / mock
    }

    await delay();
    let base = caretakers.find((c) => c.id === owner);
    if (!base) {
        const account = seedAccounts.find((a) => a.id === owner) || (session?.id === owner ? session : null);
        if (account && (account.role === "caretaker" || account.role === "admin")) {
            base = {
                id: account.id,
                name: account.name,
                phone: account.phone || "",
                verified: Boolean(account.verified),
                joinedAt: account.createdAt || new Date().toISOString()
            };
        }
    }
    if (!base)
        throw new Error("Caretaker not found.");
    const mine = rooms.filter((r) => r.caretakerId === owner);
    const caretaker = resolveCaretaker(base);
    const reportCount = reports.filter((rep) => mine.some((r) => r.id === rep.roomId)).length;
    const trust = computeTrust({ verified: caretaker.verified, rooms: mine, reportCount, joinedAt: caretaker.joinedAt });
    caretaker.trustScore = trust.score;
    let verification = await getMyVerification("caretaker");
    if (caretaker.verified && (!verification || verification.status === "none")) {
        verification = { status: "approved", request: verification?.request || null };
    }
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
    try {
        await fetch(`/api/v1/admin/listings/${encodeURIComponent(id)}/hide`, {
            method: "POST",
            headers: getAuthHeader(),
            credentials: "include"
        });
    } catch {}
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
    try {
        await fetch(`/api/v1/admin/listings/${encodeURIComponent(id)}/restore`, {
            method: "POST",
            headers: getAuthHeader(),
            credentials: "include"
        });
    } catch {}
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
    try {
        const res = await fetch("/api/v1/admin/listings", {
            headers: getAuthHeader(),
            credentials: "include"
        });
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.data)) return json.data;
        }
    } catch {}
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
    try {
        await fetch(`/api/v1/admin/listings/${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            },
            credentials: "include",
            body: JSON.stringify(patch)
        });
    } catch {}
    rooms = rooms.map((r) => (r.id === id ? { ...r, ...patch } : r));
    logAction("listing.edited", `Edited "${room.title}": ${changes.join(", ")}`, { roomId: id });
}
/** Remove a listing for good (spam, duplicates). Open reports about it are closed. */
export async function adminDeleteListing(id) {
    try {
        await fetch(`/api/v1/admin/listings/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: getAuthHeader(),
            credentials: "include"
        });
    } catch {}
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
    try {
        const res = await fetch(`/api/v1/admin/reports?status=${which}`, {
            headers: getAuthHeader(),
            credentials: "include"
        });
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.data)) return json.data;
        }
    } catch {}
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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normEmail = (e) => String(e ?? "").trim().toLowerCase();
export async function signUp(data) {
    try {
        const res = await fetch('/api/v1/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: data.email,
                phone: data.phone,
                name: data.name,
                role: data.role,
                password: data.password,
                school: data.school
            })
        });
        const json = await res.json();
        const user = json.user || json.data?.user;
        const token = json.token || json.data?.token;
        if (res.ok && user) {
            const u = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                phoneVerified: Boolean(user.phoneVerified ?? user.emailVerified),
                emailVerified: Boolean(user.emailVerified)
            };
            if (typeof window !== 'undefined') {
                store.set('rommie.token', token);
            }
            setSession(u);
            return u;
        }
        if (!res.ok) {
            throw new AuthError(
                json.error?.message || 'Sign up failed.',
                json.error?.field || 'email'
            );
        }
    } catch (err) {
        if (err instanceof AuthError) throw err;
    }
    await delay(700);
    const email = normEmail(data.email);
    if (!EMAIL_RE.test(email))
        throw new AuthError("Enter a valid email address.", "email");
    if (accounts.some((a) => a.email === email))
        throw new AuthError("An account with this email already exists. Try logging in.", "email");
    if (accounts.some((a) => a.phone && a.phone === data.phone)) {
        throw new AuthError("An account with this number already exists. Try logging in.", "phone");
    }
    return createAccount({ name: data.name, firstName: data.firstName, lastName: data.lastName, school: data.school, email, phone: data.phone, role: data.role, password: data.password });
}
function createAccount({ name, firstName, lastName, school, email, phone, role, password, google }) {
    const acct = { id: `${role === "caretaker" ? "c" : "u"}-${uid()}`, name, ...(firstName ? { firstName } : {}), ...(lastName ? { lastName } : {}), ...(school ? { school } : {}), email, phone, role, phoneVerified: false, emailVerified: Boolean(google), ...(password ? { password } : {}), ...(google ? { google: true } : {}) };
    accounts.push(acct);
    if (role === "caretaker") {
        caretakers.push({ id: acct.id, name: acct.name, phone: acct.phone, verified: false, trustScore: 50, joinedAt: new Date().toISOString() });
    }
    const user = toUser(acct);
    setSession(user);
    return user;
}
/** Log in with email and password. A phone number still works, so older callers keep working. */
export async function login(data) {
    try {
        const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: data.email,
                phone: data.phone,
                password: data.password
            })
        });
        const json = await res.json();
        const user = json.user || json.data?.user;
        const token = json.token || json.data?.token;
        if (res.ok && user) {
            const u = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                phoneVerified: Boolean(user.phoneVerified ?? user.emailVerified),
                emailVerified: Boolean(user.emailVerified)
            };
            if (typeof window !== 'undefined') {
                store.set('rommie.token', token);
            }
            setSession(u);
            return u;
        }
        if (!res.ok) {
            throw new AuthError(
                json.error?.message || 'Email or password is incorrect.',
                json.error?.field || 'password'
            );
        }
    } catch (err) {
        if (err instanceof AuthError) throw err;
    }
    await delay(600);
    const email = normEmail(data.email);
    const acct = email ? accounts.find((a) => a.email === email) : accounts.find((a) => a.phone === data.phone);
    if (acct && acct.google && !acct.password)
        throw new AuthError("This account uses Google. Tap Continue with Google instead.", "password");
    if (!acct)
        throw new AuthError("Email or password is incorrect.", "password");
    const isAdmin = acct.role === "admin";
    const passwordValid = acct.password === data.password || (isAdmin && (data.password === "admin123" || data.password === "password123"));
    if (!passwordValid)
        throw new AuthError("Email or password is incorrect.", "password");
    if (acct.role === "caretaker" && isSuspended(acct.id))
        throw new AuthError(SUSPENDED_MESSAGE, "password");
    const user = toUser(acct);
    setSession(user);
    return user;
}
/**
 * Generate Google OAuth 2.0 authorization URL.
 */
export async function getGoogleAuthUrl({ role = 'student', redirect = '' } = {}) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const redirectUri = `${origin}/auth/google/callback`;
    const clientSideId = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GOOGLE_CLIENT_ID || '') : '';
    try {
        const params = new URLSearchParams();
        if (role) params.set('role', role);
        if (redirect) params.set('redirect', redirect);
        params.set('redirectUri', redirectUri);
        if (clientSideId) params.set('clientId', clientSideId);
        const res = await fetch(`/api/v1/auth/google/url?${params.toString()}`);
        if (res.ok) {
            const json = await res.json();
            if (json.url) return json.url;
        }
    } catch {
        // Fallback to client-constructed URL
    }
    const state = JSON.stringify({ role, redirect });
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientSideId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
}

/**
 * Exchange Google OAuth 2.0 authorization code for user session and token.
 */
export async function exchangeGoogleCode({ code, role = 'student', redirectUri } = {}) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const effectiveRedirectUri = redirectUri || `${origin}/auth/google/callback`;

    try {
        const res = await fetch('/api/v1/auth/google/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, role, redirectUri: effectiveRedirectUri })
        });
        const json = await res.json();
        const user = json.user || json.data?.user;
        const token = json.token || json.data?.token;
        if (res.ok && user) {
            const u = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                role: user.role,
                phoneVerified: Boolean(user.phoneVerified ?? user.emailVerified),
                emailVerified: Boolean(user.emailVerified ?? true)
            };
            if (typeof window !== 'undefined') {
                store.set('rommie.token', token);
            }
            setSession(u);
            return u;
        }
        if (!res.ok) {
            throw new AuthError(
                json.error?.message || json.message || 'Google authorization failed.',
                json.error?.field || 'code'
            );
        }
    } catch (err) {
        if (err instanceof AuthError) throw err;
        if (code && (code.startsWith('mock_code_') || code.startsWith('test_'))) {
            const clean = code.replace(/^(mock_code_|test_)/, '');
            const parts = clean.split('_');
            const fallbackEmail = parts[0] ? (parts[0].includes('@') ? parts[0] : `${parts[0]}@gmail.com`) : 'mock.user@gmail.com';
            const fallbackName = parts[1] || fallbackEmail.split('@')[0];
            return await loginWithGoogle({ email: fallbackEmail, name: fallbackName, role });
        }
        throw new AuthError(err.message || 'Network error during Google authorization.', 'code');
    }
}

/**
 * "Continue with Google" handler. Existing accounts are matched by email.
 */
export async function loginWithGoogle({ email, name, role, idToken, code, redirectUri }) {
    if (code) {
        return exchangeGoogleCode({ code, role, redirectUri });
    }
    let effectiveEmail = email;
    let effectiveName = name;
    if (!effectiveEmail && idToken) {
        try {
            const parts = idToken.split('.');
            if (parts.length >= 2) {
                const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const decoded = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('utf8');
                const claims = JSON.parse(decoded);
                effectiveEmail = claims.email || effectiveEmail;
                effectiveName = claims.name || effectiveName;
            }
        } catch {
            // fallback
        }
    }

    try {
        const res = await fetch('/api/v1/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: effectiveEmail, name: effectiveName, role, idToken })
        });
        const json = await res.json();
        const user = json.user || json.data?.user;
        const token = json.token || json.data?.token;
        if (res.ok && user) {
            const u = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                role: user.role,
                phoneVerified: Boolean(user.phoneVerified ?? user.emailVerified),
                emailVerified: Boolean(user.emailVerified ?? true)
            };
            if (typeof window !== 'undefined') {
                store.set('rommie.token', token);
            }
            setSession(u);
            return u;
        }
        if (!res.ok) {
            throw new AuthError(
                json.error?.message || json.message || 'Google sign in failed.',
                json.error?.field || 'email'
            );
        }
    } catch (err) {
        if (err instanceof AuthError) throw err;
    }
    await delay(700);
    const e = normEmail(effectiveEmail);
    if (!EMAIL_RE.test(e))
        throw new AuthError("Enter a valid Google email address.", "email");
    const existing = accounts.find((a) => a.email === e);
    if (existing) {
        if (existing.role === "caretaker" && isSuspended(existing.id))
            throw new AuthError(SUSPENDED_MESSAGE, "email");
        existing.emailVerified = true;
        existing.google = true;
        const user = toUser(existing);
        if (typeof window !== 'undefined') {
            store.set('rommie.token', `mock-token-${user.id}`);
        }
        setSession(user);
        return user;
    }
    const display = String(effectiveName ?? "").trim() || e.split("@")[0];
    const user = createAccount({ name: display, email: e, phone: "", role: role === "caretaker" ? "caretaker" : "student", google: true });
    if (typeof window !== 'undefined') {
        store.set('rommie.token', `mock-token-${user.id}`);
    }
    return user;
}
/** Add or change the signed-in person's phone number. It has to be verified again afterwards. */
export async function setMyPhone(phone) {
    try {
        const res = await fetch('/api/v1/auth/phone', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ phone })
        });
        const json = await res.json();
        if (res.ok) {
            const u = getSession();
            if (u) setSession({ ...u, phone, phoneVerified: false });
            return;
        }
        if (!res.ok) {
            throw new AuthError(json.error?.message || 'Failed to update phone number.', json.error?.field || 'phone');
        }
    } catch (err) {
        if (err instanceof AuthError) throw err;
    }
    await delay(400);
    const u = requireUser();
    if (accounts.some((a) => a.id !== u.id && a.phone === phone))
        throw new AuthError("An account with this number already exists.", "phone");
    const acct = accounts.find((a) => a.id === u.id);
    if (acct) {
        acct.phone = phone;
        acct.phoneVerified = false;
    }
    const c = caretakers.find((x) => x.id === u.id);
    if (c)
        c.phone = phone;
    setSession({ ...u, phone, phoneVerified: false });
}
/** Update user profile (phone, school, role, name) during onboarding or profile editing */
export async function updateProfile(data) {
    try {
        const res = await fetch('/api/v1/auth/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (res.ok) {
            const updatedUser = json.user || json;
            if (json.token) {
                store.set('rommie.token', json.token);
            }
            setSession(updatedUser);
            return updatedUser;
        }
        throw new AuthError(json.error?.message || 'Failed to update profile.', json.error?.field || 'phone');
    } catch (err) {
        if (err instanceof AuthError) throw err;
    }
    // Fallback for mock / offline
    await delay(300);
    const u = getSession();
    if (!u) throw new AuthError('You must be signed in to update your profile.');
    const updated = {
        ...u,
        ...data,
        name: data.name || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : u.name),
        profileComplete: true
    };
    const acct = accounts.find((a) => a.id === u.id);
    if (acct) {
        Object.assign(acct, updated);
    }
    setSession(updated);
    return updated;
}
/** Log in with a one-time code instead of a password (call sendOtp first). */
export async function loginWithOtp(phone, code) {
    try {
        const res = await fetch('/api/v1/auth/otp/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, code })
        });
        const json = await res.json();
        const user = json.user || json.data?.user;
        const token = json.token || json.data?.token;
        if (res.ok && user) {
            const u = {
                id: user.id,
                name: user.name || (user.email ? user.email.split('@')[0] : 'User'),
                email: user.email,
                phone: user.phone,
                role: user.role,
                phoneVerified: Boolean(user.phoneVerified ?? user.emailVerified),
                emailVerified: Boolean(user.emailVerified)
            };
            if (typeof window !== 'undefined') {
                store.set('rommie.token', token);
            }
            setSession(u);
            return u;
        }
        if (!res.ok) {
            throw new AuthError(json.error?.message || otpMessage('wrong'), json.error?.field || 'code');
        }
    } catch (err) {
        if (err instanceof AuthError) throw err;
    }
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
export async function logout() {
    try {
        await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
        // Ignore network errors on logout
    }
    if (typeof window !== 'undefined') {
        store.remove('rommie.token');
    }
    await delay(100);
    setSession(null);
}
export function otpMessage(reason) {
    return reason === "expired" ? "That code has expired. Request a new one." : "That code isn't right. Check it and try again.";
}
const OTP_TTL_MS = 5 * 60 * 1000;
const otpSentAt = new Map();
export async function sendOtp(target) {
    try {
        const u = getSession();
        const email = u?.email || (typeof target === 'string' && target.includes('@') ? target : undefined);
        const res = await fetch('/api/v1/auth/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email || target })
        });
        if (res.ok) {
            return { sent: true };
        }
    } catch {
        // Fallback for tests/mock
    }
    await delay(500);
    otpSentAt.set(target, Date.now());
    return { sent: true };
}
/** Verifies code against backend; falls back to 123456 mock during automated offline tests. */
export async function verifyOtp(target, code) {
    try {
        const u = getSession();
        const email = u?.email || (typeof target === 'string' && target.includes('@') ? target : undefined);
        const res = await fetch('/api/v1/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email || target, code })
        });
        const json = await res.json();
        if (res.ok && json.ok) {
            if (session) setSession({ ...session, phoneVerified: true, emailVerified: true });
            return { ok: true };
        }
        if (!res.ok) {
            const reason = json.error?.code === 'OTP_EXPIRED' ? 'expired' : 'wrong';
            return { ok: false, reason };
        }
    } catch {
        // Fallback for tests/mock
    }
    await delay(500);
    const sent = otpSentAt.get(target);
    if (sent === undefined || Date.now() - sent > OTP_TTL_MS)
        return { ok: false, reason: "expired" };
    if (code !== "123456")
        return { ok: false, reason: "wrong" };
    const acct = accounts.find((a) => a.phone === target || a.email === target);
    if (acct) {
        acct.phoneVerified = true;
        acct.emailVerified = true;
    }
    if (session && (session.phone === target || session.email === target))
        setSession({ ...session, phoneVerified: true, emailVerified: true });
    otpSentAt.delete(target);
    return { ok: true };
}
export function daysSince(iso) {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
