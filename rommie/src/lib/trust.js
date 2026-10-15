import { STALE_DAYS } from "@/lib/format";
export const TRUST_MAX = { verification: 35, freshness: 30, reports: 25, age: 10 };
const DAY = 86400000;
const FRESH_DAYS = STALE_DAYS;
/**
 * Front-end stand-in for the trust score. The real calculation comes from the backend; this only
 * exists so the UI has a believable 0 to 100 score with a breakdown that adds up.
 */
export function computeTrust({ verified, rooms, reportCount, joinedAt, now = Date.now() }) {
    const vacant = rooms.filter((r) => r.status === "Vacant");
    const fresh = vacant.filter((r) => (now - new Date(r.lastConfirmedVacantAt).getTime()) / DAY < FRESH_DAYS).length;
    const freshness = vacant.length === 0 ? TRUST_MAX.freshness / 2 : Math.round((TRUST_MAX.freshness * fresh) / vacant.length);
    const reports = Math.max(0, TRUST_MAX.reports - 8 * reportCount);
    const months = Math.max(0, Math.floor((now - new Date(joinedAt).getTime()) / (30 * DAY)));
    const age = Math.min(TRUST_MAX.age, months);
    const items = [
        {
            key: "verification",
            label: "Verification",
            points: verified ? TRUST_MAX.verification : 0,
            max: TRUST_MAX.verification,
            note: verified ? "ID checked by our team" : "Not verified yet",
        },
        {
            key: "freshness",
            label: "Listing freshness",
            points: freshness,
            max: TRUST_MAX.freshness,
            note: vacant.length === 0 ? "No vacant listings to check yet" : `${fresh} of ${vacant.length} vacant rooms confirmed in the last ${FRESH_DAYS} days`,
        },
        {
            key: "reports",
            label: "Reports",
            points: reports,
            max: TRUST_MAX.reports,
            note: reportCount === 0 ? "No reports on your listings" : `${reportCount} report${reportCount === 1 ? "" : "s"} on your listings`,
        },
        {
            key: "age",
            label: "Account age",
            points: age,
            max: TRUST_MAX.age,
            note: months < 1 ? "Joined this month" : `${months} month${months === 1 ? "" : "s"} on Rommie`,
        },
    ];
    const score = Math.max(0, Math.min(100, items.reduce((sum, i) => sum + i.points, 0)));
    return { score, items };
}
