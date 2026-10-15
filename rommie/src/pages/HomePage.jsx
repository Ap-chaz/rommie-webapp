import { usePageMeta } from "@/lib/usePageMeta";
import { useRef } from "react";
import { Link } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ChevronLeft, ChevronRight, Clock, GraduationCap, Mountain, MapPin, MessageCircle, ShieldCheck, Trees, Building, Landmark, Tent } from "lucide-react";
import { getRooms, daysSince } from "@/services/api";
import { SearchCapsule } from "@/components/SearchCapsule";
import { RoomCard, RoomCardSkeleton } from "@/components/RoomCard";
const PAGE_META = [
            { title: "Rommie · Vacant student rooms near CUEA, KSL & Co-op" },
            { name: "description", content: "Find cheap, currently vacant rooms near CUEA, KSL and Co-operative University. Contact the caretaker directly on WhatsApp or call." },
            { property: "og:title", content: "Rommie · Vacant student rooms near campus" },
            { property: "og:description", content: "Cheap, vacant rooms in Rongai, Gataka, Ngong, Karen and Maasai Lodge." },
        ];
const categories = [
    { label: "Rongai", icon: Building, search: { area: "Rongai" } },
    { label: "Gataka", icon: Trees, search: { area: "Gataka" } },
    { label: "Ngong", icon: Mountain, search: { area: "Ngong" } },
    { label: "Karen", icon: Landmark, search: { area: "Karen" } },
    { label: "Maasai Lodge", icon: Tent, search: { area: "Maasai Lodge" } },
    { label: "Near KSL", icon: GraduationCap, search: { near: "KSL" } },
    { label: "Near CUEA", icon: GraduationCap, search: { near: "CUEA" } },
    { label: "Near Co-op", icon: GraduationCap, search: { near: "Co-op" } },
];
const rows = [
    { title: "Vacant now in Rongai", search: { area: "Rongai" }, pick: (r) => r.filter((x) => x.area === "Rongai") },
    { title: "Near KSL gate", search: { near: "KSL" }, pick: (r) => r.filter((x) => (x.distances.KSL.walkMin ?? 99) <= 15) },
    { title: "Near CUEA", search: { near: "CUEA" }, pick: (r) => r.filter((x) => (x.distances.CUEA.walkMin ?? x.distances.CUEA.matatuMin ?? 99) <= 15) },
    { title: "Budget rooms under KES 6,000", search: { maxRent: 6000 }, pick: (r) => r.filter((x) => x.rentKes <= 6000) },
    { title: "Recently confirmed vacant", search: { sort: "newest" }, pick: (r) => r.filter((x) => daysSince(x.lastConfirmedVacantAt) <= 3) },
];
function Row({ title, search, items, loading }) {
    const ref = useRef(null);
    const scroll = (d) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: "smooth" });
    if (!loading && items.length === 0)
        return null;
    return (<section>
      <div className="mb-4 flex items-center gap-3">
        <span aria-hidden className="h-7 w-1 shrink-0 rounded-full bg-hof"/>
        <h2 className="text-section min-w-0">
          {title}
          {!loading && <span className="ml-2 whitespace-nowrap text-sm font-normal text-foggy">· {items.length} {items.length === 1 ? "room" : "rooms"}</span>}
        </h2>
        <span className="flex-1"/>
        <Link to="/rooms" search={search} className="shrink-0 text-sm font-medium underline underline-offset-4 hover:text-foggy">
          See all
        </Link>
        <div className="hidden gap-1.5 md:flex">
          {[-1, 1].map((d) => (<button key={d} onClick={() => scroll(d)} aria-label={d < 0 ? "Previous" : "Next"} className="flex h-8 w-8 items-center justify-center rounded-lg border border-bebe bg-card hover:bg-faint">
              {d < 0 ? <ChevronLeft className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
            </button>))}
        </div>
      </div>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 md:mx-0 md:scroll-px-0 md:px-0">
        {(loading ? Array.from({ length: 6 }) : items).map((r, i) => (<div key={i} className="w-[72%] shrink-0 snap-start sm:w-[40%] md:w-[calc((100%-36px)/4)] xl:w-[calc((100%-48px)/5)]">
            {loading ? <RoomCardSkeleton /> : <RoomCard room={r}/>}
          </div>))}
      </div>
    </section>);
}
export default function Home() {
    usePageMeta(PAGE_META);
    const q = useQuery({ queryKey: ["rooms", "home"], queryFn: () => getRooms({ vacantOnly: true }) });
    return (<div className="page-container space-y-12 py-8">
      <div className="space-y-8">
        <SearchCapsule />
        <div className="no-scrollbar -mx-4 flex gap-8 overflow-x-auto px-4 lg:justify-center">
          {categories.map((c) => (<Link key={c.label} to="/rooms" search={c.search} className="flex min-w-16 shrink-0 flex-col items-center gap-2 border-b-2 border-transparent pb-2 text-foggy transition-colors hover:border-deco hover:text-hof">
              <c.icon className="h-6 w-6" strokeWidth={1.5}/>
              <span className="whitespace-nowrap text-xs font-medium">{c.label}</span>
            </Link>))}
        </div>
      </div>

      {q.isError ? (<div className="rounded-xl bg-card p-10 text-center">
          <p className="text-section">Couldn't load rooms</p>
          <button onClick={() => q.refetch()} className="mt-4 rounded-lg bg-hof px-5 py-3 text-primary-foreground">Retry</button>
        </div>) : (rows.map((r) => <Row key={r.title} title={r.title} search={r.search} items={q.data ? r.pick(q.data) : []} loading={!q.data}/>))}

      <section className="grid gap-6 border-y border-bebe py-10 sm:grid-cols-2 lg:grid-cols-4">
        {[
            { icon: BadgeCheck, t: "Verified student spaces" },
            { icon: Clock, t: "Fresh vacancies — every room shows when it was last confirmed" },
            { icon: MapPin, t: "Distance to CUEA, KSL and Co-op gates" },
            { icon: MessageCircle, t: "One-tap WhatsApp and Call to the caretaker" },
        ].map((x) => (<div key={x.t} className="flex items-start gap-3">
            <x.icon className="h-6 w-6 shrink-0" strokeWidth={1.5}/>
            <p>{x.t}</p>
          </div>))}
      </section>

      <div className="flex items-start gap-3 rounded-xl bg-card p-6">
        <ShieldCheck className="h-6 w-6 shrink-0" strokeWidth={1.5}/>
        <p>Never pay before viewing the room. Rommie never asks for money to show you a listing.</p>
      </div>
    </div>);
}
