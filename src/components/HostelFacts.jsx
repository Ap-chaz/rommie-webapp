import { Bus, Utensils, Users, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

const genderText = { Ladies: "Ladies only", Gents: "Gents only", Mixed: "Ladies & gents" };

/** The facts that decide a hostel for most students, each with an icon. Unavailable services are struck through. */
function hostelFacts(room) {
    const facts = [];
    if (room.gender)
        facts.push({ key: "gender", Icon: Users, label: genderText[room.gender], on: true });
    facts.push({ key: "meals", Icon: Utensils, label: room.meals === "available" ? "Meals available" : "No meals", on: room.meals === "available" });
    facts.push({ key: "transport", Icon: Bus, label: room.transport ? "Transport to campus" : "No transport", on: !!room.transport });
    return facts;
}

/** Compact icon chips for cards. */
export function HostelChips({ room, className }) {
    return (<ul className={cn("flex flex-wrap gap-1.5 text-xs", className)} aria-label="Hostel services">
      {hostelFacts(room).map(({ key, Icon, label, on }) => (<li key={key} className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5", on ? "border-hof font-medium" : "border-bebe text-foggy line-through decoration-1")}>
          <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden/>
          {label}
        </li>))}
    </ul>);
}

/** Larger icon list for the detail page. */
export function HostelFactList({ room }) {
    return (<ul className="grid gap-3 sm:grid-cols-3">
      {hostelFacts(room).map(({ key, Icon, label, on }) => (<li key={key} className={cn("flex items-center gap-3 rounded-xl border p-3", on ? "border-hof" : "border-bebe text-foggy")}>
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-faint">
            <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden/>
            {!on && <Ban className="absolute h-10 w-10 text-foggy" strokeWidth={1} aria-hidden/>}
          </span>
          <span className="font-medium">{label}</span>
        </li>))}
    </ul>);
}

/** Hostel services as rows for the "What this place offers" list: only what the hostel actually provides. */
export function hostelOffers(room) {
    if (room.roomType !== "hostel")
        return [];
    return hostelFacts(room).filter((f) => f.on);
}
