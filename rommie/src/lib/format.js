export const formatKes = (n) => `KES ${n.toLocaleString("en-KE")}`;
export const roomTypeLabel = {
    bedsitter: "Bedsitter",
    single_room: "Single Room",
    one_bedroom: "One Bedroom",
};
export const AREAS = ["Gataka", "Rongai", "Maasai Lodge", "Ngong", "Karen"];
export function daysAgoLabel(days) {
    if (days <= 0)
        return "today";
    if (days === 1)
        return "1 day ago";
    return `${days} days ago`;
}
/** Closest campus as a short phrase, e.g. "10 min walk to KSL". */
export function nearestCampus(r) {
    const entries = Object.entries(r.distances);
    const best = entries
        .map(([c, d]) => ({ c, min: d.walkMin ?? d.matatuMin ?? 999, walk: d.walkMin != null }))
        .sort((a, b) => a.min - b.min)[0];
    return `${best.min} min ${best.walk ? "walk" : "matatu"} to ${best.c}`;
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
