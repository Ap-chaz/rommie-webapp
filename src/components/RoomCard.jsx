import { useState } from "react";
import { Link } from "@/lib/router";
import { Bus, Footprints, Heart, MessageCircle, ShieldCheck } from "lucide-react";
import { useSaved } from "@/lib/saved";
import { daysSince } from "@/services/api";
import { daysAgoLabel, formatKes, nearestCampus, roomTypeLabel, STALE_DAYS, whatsappLink } from "@/lib/format";
import { cn } from "@/lib/utils";
export function StatusLine({ room }) {
    const d = daysSince(room.lastConfirmedVacantAt);
    if (room.status === "Taken")
        return <p className="text-foggy">Taken · marked {new Date(room.lastConfirmedVacantAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</p>;
    if (d >= STALE_DAYS)
        return (<div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-hof px-2.5 py-0.5 text-xs font-semibold">Needs reconfirming</span>
        <span className="text-xs text-foggy">Ask the caretaker before visiting.</span>
      </div>);
    return (<p className="truncate text-foggy">
      <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-vacant align-middle" aria-hidden/>
      Vacant · confirmed {daysAgoLabel(d)}
    </p>);
}
/** Compact status chip used on cards: vacant (green dot), needs reconfirming, or taken. */
function StatusChip({ room }) {
    const d = daysSince(room.lastConfirmedVacantAt);
    const base = "inline-flex max-w-full items-start gap-1.5 rounded-md px-2 py-1 text-xs leading-snug";
    if (room.status === "Taken")
        return <span className={cn(base, "bg-faint text-foggy")}>Taken</span>;
    if (d >= STALE_DAYS)
        return <span className={cn(base, "border border-hof font-semibold")}>Needs reconfirming</span>;
    return (<span className={cn(base, "bg-faint")}>
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-vacant" aria-hidden/>
      <span>Vacant · confirmed {daysAgoLabel(d)}</span>
    </span>);
}
export function RoomCard({ room }) {
    const [idx, setIdx] = useState(0);
    const { isSaved, toggle } = useSaved();
    const saved = isSaved(room.id);
    const taken = room.status === "Taken";
    const distance = nearestCampus(room);
    const DistanceIcon = distance.includes("matatu") ? Bus : Footprints;
    return (<article className="group @container relative w-full overflow-hidden rounded-lg border border-bebe bg-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-deco">
        <Link to="/rooms/$id" params={{ id: room.id }} aria-label={room.title}>
          <div className="flex h-full transition-transform duration-300" style={{ transform: `translateX(-${idx * 100}%)` }}>
            {room.photos.map((p, i) => (<img key={i} src={p} alt={`${room.title}, photo ${i + 1}`} loading="lazy" width={816} height={612} className={cn("h-full w-full shrink-0 object-cover", taken && "opacity-70")}/>))}
          </div>
        </Link>
        <button aria-label={saved ? "Remove from saved rooms" : "Save room"} aria-pressed={saved} onClick={() => toggle(room.id)} className="absolute right-1 top-1 flex h-12 w-12 items-center justify-center">
          <Heart className={cn("h-6 w-6", saved ? "fill-rausch stroke-rausch" : "fill-hof/40 stroke-card")} strokeWidth={2}/>
        </button>
        <div className="absolute inset-x-0 bottom-10 flex justify-center [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:group-hover:opacity-100">
          {room.photos.length > 1 && room.photos.map((_, i) => (<button key={i} aria-label={`Show photo ${i + 1}`} onClick={() => setIdx(i)} className="flex h-8 w-4 items-center justify-center">
              <span className={cn("h-1.5 w-1.5 rounded-full bg-card", i === idx ? "opacity-100" : "opacity-60")}/>
            </button>))}
        </div>
        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
          {room.caretaker.verified ? (<span className="flex min-w-0 items-center gap-1 rounded-md bg-card px-1.5 py-1 text-xs font-semibold shadow-search @min-[14rem]:px-2">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden/>
              <span className="hidden @min-[14rem]:inline">Verified</span>
              <span className="sr-only @min-[14rem]:hidden">Verified</span>
            </span>) : <span />}
          <span className="shrink-0 whitespace-nowrap rounded-md bg-hof/90 px-2 py-1 text-xs font-semibold text-primary-foreground">
            {formatKes(room.rentKes)}<span className="hidden font-normal @min-[14rem]:inline">/mo</span>
          </span>
        </div>
      </div>
      <div className="space-y-1.5 p-3">
        <Link to="/rooms/$id" params={{ id: room.id }} className="block space-y-0.5">
          <h3 className="truncate font-medium">{room.title}</h3>
          <p className="truncate text-foggy">{room.area} · {roomTypeLabel[room.roomType]}</p>
          <p className="flex items-start gap-1.5 leading-snug text-foggy">
            <DistanceIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden/>
            <span>{distance}</span>
          </p>
        </Link>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusChip room={room}/>
          <span className="text-xs text-foggy">Trust {room.caretaker.trustScore}</span>
        </div>
        {!taken && (<a href={whatsappLink(room)} target="_blank" rel="noreferrer" className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-hof text-sm font-medium hover:bg-faint">
            <MessageCircle className="h-4 w-4" aria-hidden/> WhatsApp
          </a>)}
      </div>
    </article>);
}
export function RoomCardSkeleton() {
    return (<div className="w-full animate-pulse overflow-hidden rounded-lg border border-bebe bg-card">
      <div className="aspect-[4/3] bg-deco"/>
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-3/4 rounded bg-deco"/>
        <div className="h-3.5 w-1/2 rounded bg-deco"/>
        <div className="h-3.5 w-2/3 rounded bg-deco"/>
        <div className="h-9 w-full rounded-lg bg-deco"/>
      </div>
    </div>);
}
