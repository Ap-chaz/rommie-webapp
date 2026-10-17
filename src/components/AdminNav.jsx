import { Link, usePathname } from "@/lib/router";
import { cn } from "@/lib/utils";
export const ADMIN_LINKS = [
    { label: "Dashboard", to: "/admin" },
    { label: "Listings", to: "/admin/listings" },
    { label: "Reports", to: "/admin/reports" },
    { label: "Users", to: "/admin/users" },
    { label: "Verification", to: "/admin/verification" },
    { label: "Analytics", to: "/admin/analytics" },
    { label: "Activity", to: "/admin/activity" },
    { label: "Settings", to: "/admin/settings" },
];
/** One row of links shared by every admin page, so nobody has to go back to the dashboard to switch. */
export function AdminNav() {
    const path = usePathname().replace(/\/$/, "") || "/";
    return (<nav aria-label="Admin" className="no-scrollbar -mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-bebe">
      {ADMIN_LINKS.map((l) => {
            const active = path === l.to;
            return (<Link key={l.to} to={l.to} ref={active ? (el) => el?.scrollIntoView?.({ inline: "center", block: "nearest" }) : undefined} aria-current={active ? "page" : undefined} className={cn("shrink-0 border-b-2 px-3 pb-3 pt-1 text-base", active ? "border-hof font-medium text-hof" : "border-transparent text-foggy hover:text-hof")}>
            {l.label}
          </Link>);
        })}
    </nav>);
}
