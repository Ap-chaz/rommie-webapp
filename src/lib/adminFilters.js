import { daysSince } from "@/services/api";
import { STALE_DAYS } from "@/lib/format";

/** True for a vacant listing nobody has confirmed in STALE_DAYS days or more. */
export const isStale = (r) => r.status === "Vacant" && daysSince(r.lastConfirmedVacantAt) >= STALE_DAYS;

/**
 * Filter the admin listings table. Every filter is optional; an empty one matches everything.
 * `q` matches the title, area and caretaker name, ignoring case and extra spaces.
 * `visibility` is "visible" or "hidden"; `status` is "Vacant" or "Taken"; `stale` keeps only stale vacancies.
 */
export function filterAdminListings(list, f = {}) {
    const q = (f.q ?? "").trim().toLowerCase();
    return list.filter((r) => {
        if (q && !`${r.title} ${r.area} ${r.caretaker?.name ?? ""}`.toLowerCase().includes(q))
            return false;
        if (f.roomType && r.roomType !== f.roomType)
            return false;
        if (f.area && r.area !== f.area)
            return false;
        if (f.status && r.status !== f.status)
            return false;
        if (f.visibility === "hidden" && !r.hidden)
            return false;
        if (f.visibility === "visible" && r.hidden)
            return false;
        if (f.stale && !isStale(r))
            return false;
        return true;
    });
}
/** Search and status filter for the admin Users page. Students are never suspended. */
export function filterUsers(list, { q = "", status = "all" } = {}) {
    const term = q.trim().toLowerCase();
    const digits = term.replace(/\D/g, "").replace(/^0/, "");
    return list.filter((u) => {
        if (term && !(u.name.toLowerCase().includes(term) || (digits && u.phone.replace(/\D/g, "").includes(digits))))
            return false;
        if (status === "verified")
            return !!u.verified;
        if (status === "unverified")
            return !u.verified;
        if (status === "suspended")
            return !!u.suspended;
        if (status === "none")
            return false;
        return true;
    });
}
/** Activity actions are named "group.verb", so the prefix decides which filter they belong to. */
export const ACTIVITY_GROUPS = [
    { id: "listing", label: "Listings" },
    { id: "report", label: "Reports" },
    { id: "verification", label: "Verification" },
    { id: "caretaker", label: "Users" },
    { id: "settings", label: "Settings" },
];
export function filterActivity(list, group = "all") {
    return group === "all" ? list : list.filter((a) => a.action.split(".")[0] === group);
}
