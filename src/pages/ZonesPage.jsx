import { usePageMeta } from "@/lib/usePageMeta";
import { Link } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { RoomCard, RoomCardSkeleton } from "@/components/RoomCard";
import { ErrorCard } from "@/components/StateCard";
import { AREAS, CAMPUSES, formatKes } from "@/lib/format";
import { getRooms, minutesTo } from "@/services/api";
const desc = "Vacant rooms grouped by distance to CUEA, KSL, JKUAT Karen, Tangaza and Co-op University.";
const PAGE_META = [
            { title: "Campus Zones · Rommie" },
            { name: "description", content: desc },
            { property: "og:title", content: "Campus Zones · Rommie" },
            { property: "og:description", content: desc },
        ];
export default function Zones() {
    usePageMeta(PAGE_META);
    return (<div className="page-container py-6 md:py-10">
      <h1 className="text-page">Campus zones</h1>
      <p className="mt-2 max-w-2xl text-foggy">Pick your campus to see vacant rooms within about 20 minutes of its gate, nearest first. Every room shows when it was last confirmed.</p>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Browse by area">
        {AREAS.map((a) => (<Link key={a} to="/rooms" search={{ area: a }} className="rounded-full border border-bebe bg-card px-4 py-2 font-medium hover:bg-bebe">{a}</Link>))}
      </div>

      <div className="mt-12 space-y-14">
        {CAMPUSES.map((c) => <Zone key={c.id} campus={c}/>)}
      </div>
    </div>);
}
function Zone({ campus }) {
    const q = useQuery({ queryKey: ["rooms", "zone", campus.id], queryFn: () => getRooms({ near: campus.id, vacantOnly: true }) });
    const nearest = q.data ? [...q.data].sort((a, b) => minutesTo(a, campus.id) - minutesTo(b, campus.id)) : [];
    const cheapest = nearest.length ? Math.min(...nearest.map((r) => r.rentKes)) : null;
    return (<section aria-labelledby={`zone-${campus.id}`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`zone-${campus.id}`} className="text-section">Near {campus.short}</h2>
          <p className="text-foggy">
            {campus.name}
            {q.data && <> · {nearest.length} vacant {nearest.length === 1 ? "room" : "rooms"}{cheapest !== null && <> · from {formatKes(cheapest)}/month</>}</>}
          </p>
        </div>
        <Link to="/rooms" search={{ near: campus.id }} className="flex items-center gap-1.5 font-medium hover:underline">
          See all near {campus.short} <ArrowRight className="h-4 w-4" aria-hidden/>
        </Link>
      </div>

      {q.isError ? (<ErrorCard title={`Couldn't load rooms near ${campus.short}`} onRetry={() => void q.refetch()}/>) : !q.data ? (<Cards>{Array.from({ length: 4 }).map((_, i) => <RoomCardSkeleton key={i}/>)}</Cards>) : nearest.length === 0 ? (<p className="rounded-xl bg-card p-6 text-foggy">No vacant rooms near {campus.short} right now. Create an alert and we'll text you when one opens.</p>) : (<Cards>{nearest.slice(0, 4).map((r) => <RoomCard key={r.id} room={r}/>)}</Cards>)}
    </section>);
}
function Cards({ children }) {
    return <div className="grid grid-cols-1 gap-x-3 gap-y-8 min-[500px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}
