export const formatKes = (n) => `KES ${n.toLocaleString("en-KE")}`;
export const roomTypeLabel = {
    bedsitter: "Bedsitter",
    single_room: "Single Room",
    one_bedroom: "One Bedroom",
    hostel: "Hostel",
};
export const GENDERS = ["Ladies", "Gents"];
/** Months in a university semester, used to turn a per-semester hostel price into a monthly figure. */
export const SEMESTER_MONTHS = 4;
/** Monthly equivalent of a room option's price (low end), rounded to the nearest 10 shillings. */
export function monthlyKes(o) {
    return o.billing === "semester" ? Math.round(o.rentKes / SEMESTER_MONTHS / 10) * 10 : o.rentKes;
}
/** "KES 15,000" or "KES 15,000 - 19,000" per month or semester. */
export function optionPrice(o) {
    const range = o.maxKes ? `${formatKes(o.rentKes)} - ${o.maxKes.toLocaleString("en-KE")}` : formatKes(o.rentKes);
    return `${range} / ${o.billing === "semester" ? "semester" : "month"}`;
}
/** Cheapest monthly figure across a hostel's options; used as the listing's headline rent. */
export const cheapestMonthly = (options) => Math.min(...options.map(monthlyKes));
/** Whether a listing passes a gender filter. Open rentals (no gender set) and mixed hostels always pass. */
export const genderMatches = (r, g) => !g || !r.gender || r.gender === "Mixed" || r.gender === g;
export const AREAS = ["Gataka", "Rongai", "Maasai Lodge", "Karen"];
/**
 * The five campuses Rommie serves. This is the single source of truth: search, filters, the zones page,
 * the caretaker form and the footer all read from here. `key` is the prefix used for form field names.
 */
export const CAMPUSES = [
    { id: "KSL", key: "ksl", short: "KSL", name: "Kenya School of Law" },
    { id: "JKUAT", key: "jkuat", short: "JKUAT Karen", name: "JKUAT Karen Campus" },
    { id: "Tangaza", key: "tangaza", short: "Tangaza", name: "Tangaza University" },
    { id: "CUEA", key: "cuea", short: "CUEA", name: "Catholic University of Eastern Africa" },
    { id: "Co-op", key: "coop", short: "Co-op", name: "Co-operative University of Kenya" },
];
export const CAMPUS_IDS = CAMPUSES.map((c) => c.id);
/** Short display name for a campus id ("JKUAT" -> "JKUAT Karen"). Undefined stays undefined. */
export const campusShort = (id) => CAMPUSES.find((c) => c.id === id)?.short ?? id;
export function daysAgoLabel(days) {
    if (days <= 0)
        return "today";
    if (days === 1)
        return "1 day ago";
    return `${days} days ago`;
}
/** Closest campus as a short phrase, e.g. "10 min walk to KSL". */
export function nearestCampus(r) {
    if (r.distanceLabel)
        return r.distanceLabel;
    const best = Object.entries(r.distances ?? {})
        .map(([c, d]) => ({ c, min: d?.walkMin ?? d?.matatuMin ?? 999, walk: d?.walkMin != null }))
        .sort((a, b) => a.min - b.min)[0];
    if (!best || best.min === 999)
        return "";
    return `${best.min} min ${best.walk ? "walk" : "matatu"} to ${campusShort(best.c)}`;
}
export function whatsappLink(r) {
    const msg = `Hi, I saw your ${roomTypeLabel[r.roomType].toLowerCase()} in ${r.area} at ${formatKes(r.rentKes)} on Rommie. Is it still vacant?`;
    return `https://wa.me/${r.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
}
/** Normalize Kenyan phone numbers to +254 format; returns null if invalid. */
export function normalizeKenyanPhone(input) {
    const s = input.replace(/[\s-]/g, "");
    let m = s.match(/^0([17]\d{8})$/);
    if (m)
        return `+254${m[1]}`;
    m = s.match(/^\+?254([17]\d{8})$/);
    if (m)
        return `+254${m[1]}`;
    return null;
}
export const STALE_DAYS = 14;
export const AMENITY_OPTIONS = ["Water 24/7", "WiFi", "Tokens", "Gated Security"];
export const amenityFormLabel = {
    "Water 24/7": "Water 24/7",
    WiFi: "WiFi",
    Tokens: "Tokens / prepaid power",
    "Gated Security": "Gated security",
};
/** One-line description of a vacancy alert, e.g. "Bedsitter under KES 6,000 in Rongai." */
export function alertSummary(a) {
    const type = a.roomType ? roomTypeLabel[a.roomType] : "Any room";
    const rent = a.maxRentKes ? ` under ${formatKes(a.maxRentKes)}` : "";
    const where = a.area ? ` in ${a.area}` : "";
    return `${type}${rent}${where}.`;
}
/** "14 Oct 2026" style date used on cards and tables. */
export const shortDate = (iso) => new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
