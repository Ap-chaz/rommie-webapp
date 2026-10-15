import { usePageMeta } from "@/lib/usePageMeta";
import { useNavigate, useSearch } from "@/lib/router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { getRooms } from "@/services/api";
import { RoomCard, RoomCardSkeleton } from "@/components/RoomCard";
import { SearchCapsule } from "@/components/SearchCapsule";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { AREAS, CAMPUS_IDS, GENDERS, roomTypeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuthGate } from "@/lib/auth";
const AMENITIES = ["Water 24/7", "WiFi", "Tokens", "Gated Security"];
const num = (v) => (v === undefined || v === "" || isNaN(Number(v)) ? undefined : Number(v));
/** Filters live in the URL (?area=Rongai&maxRent=6000) so a search can be shared and survives a reload. */
const validateSearch = (s) => ({
    area: AREAS.includes(s["area"]) ? s["area"] : undefined,
    roomType: typeof s["roomType"] === "string" && s["roomType"] in roomTypeLabel ? s["roomType"] : undefined,
    minRent: num(s["minRent"]),
    maxRent: num(s["maxRent"]),
    near: CAMPUS_IDS.includes(s["near"]) ? s["near"] : undefined,
    amenities: Array.isArray(s["amenities"]) ? s["amenities"].filter((a) => AMENITIES.includes(a)) : undefined,
    gender: GENDERS.includes(s["gender"]) ? s["gender"] : undefined,
    mealsOnly: s["mealsOnly"] === true || s["mealsOnly"] === "true" ? true : undefined,
    transportOnly: s["transportOnly"] === true || s["transportOnly"] === "true" ? true : undefined,
    vacantOnly: s["vacantOnly"] === false || s["vacantOnly"] === "false" ? false : undefined,
    sort: ["newest", "rent_asc", "rent_desc"].includes(s["sort"]) ? s["sort"] : undefined,
});
const PAGE_META = [
            { title: "Find a room near campus · Rommie" },
            { name: "description", content: "Browse vacant bedsitters, single rooms and one bedrooms near CUEA, KSL, JKUAT Karen, Tangaza and Co-op University." },
            { property: "og:title", content: "Find a room near campus · Rommie" },
            { property: "og:description", content: "Vacant rooms in Rongai, Gataka, Karen and Maasai Lodge." },
        ];
function Filters({ f, set }) {
    const vacantOnly = f.vacantOnly !== false;
    return (<div className="space-y-6">
      <section>
        <h3 className="mb-3 text-base font-medium">Area</h3>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (<Chip key={a} on={f.area === a} onClick={() => set({ area: f.area === a ? undefined : a })}>{a}</Chip>))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-base font-medium">Rent (KES / month)</h3>
        <div className="flex items-center gap-2">
          <input type="number" min={0} placeholder="Min" aria-label="Minimum rent" defaultValue={f.minRent} onBlur={(e) => set({ minRent: num(e.target.value) })} className="h-11 w-full min-w-0 rounded-lg border border-deco bg-card px-3 text-base placeholder:text-grey-500"/>
          <span className="text-foggy">–</span>
          <input type="number" min={0} placeholder="Max" aria-label="Maximum rent" defaultValue={f.maxRent} onBlur={(e) => set({ maxRent: num(e.target.value) })} className="h-11 w-full min-w-0 rounded-lg border border-deco bg-card px-3 text-base placeholder:text-grey-500"/>
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-base font-medium">Room type</h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(roomTypeLabel).map((t) => (<Chip key={t} on={f.roomType === t} onClick={() => set({ roomType: f.roomType === t ? undefined : t })}>{roomTypeLabel[t]}</Chip>))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-base font-medium">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => {
            const on = f.amenities?.includes(a);
            return (<Chip key={a} on={!!on} onClick={() => set({ amenities: on ? f.amenities.filter((x) => x !== a) : [...(f.amenities ?? []), a] })}>{a}</Chip>);
        })}
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-base font-medium">Hostels</h3>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (<Chip key={g} on={f.gender === g} onClick={() => set({ gender: f.gender === g ? undefined : g })}>{g}</Chip>))}
          <Chip on={!!f.mealsOnly} onClick={() => set({ mealsOnly: f.mealsOnly ? undefined : true })}>Meals available</Chip>
          <Chip on={!!f.transportOnly} onClick={() => set({ transportOnly: f.transportOnly ? undefined : true })}>Transport to campus</Chip>
        </div>
      </section>
      <label className="flex items-center justify-between border-t border-bebe pt-5">
        <span className="text-base font-medium">Vacant only</span>
        <Switch checked={vacantOnly} onCheckedChange={(c) => set({ vacantOnly: c ? undefined : false })}/>
      </label>
    </div>);
}
function Chip({ on, children, onClick }) {
    return (<button onClick={onClick} className={cn("min-h-10 rounded-full border px-4 text-sm transition-colors", on ? "border-hof bg-hof text-primary-foreground" : "border-deco bg-card hover:border-hof")}>
      {children}
    </button>);
}
export default function RoomsPage() {
    usePageMeta(PAGE_META);
    const gate = useAuthGate();
    const f = useSearch(validateSearch);
    const nav = useNavigate();
    const set = (p) => nav({ to: "/rooms", search: { ...f, ...p }, replace: true });
    const clear = () => nav({ to: "/rooms" });
    const filters = { ...f, vacantOnly: f.vacantOnly !== false };
    const q = useQuery({ queryKey: ["rooms", filters], queryFn: () => getRooms(filters), placeholderData: keepPreviousData });
    return (<div className="page-container py-6">
      <div className="mb-8"><SearchCapsule compact/></div>
      <div className="flex gap-6 xl:gap-10">
        <aside className="sticky top-[calc(var(--header-h)+1.5rem)] hidden max-h-[calc(100dvh-var(--header-h)-3rem)] w-72 shrink-0 overflow-y-auto overscroll-contain rounded-xl bg-card p-6 lg:block">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-section">Filters</h2>
            <button onClick={clear} className="text-sm font-medium underline">Clear</button>
          </div>
          <Filters f={f} set={set}/>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-foggy">{q.data ? `${q.data.length} rooms` : "Loading rooms"}</p>
            <div className="flex min-w-0 items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden"><SlidersHorizontal /> Filters</Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl">
                  <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                  <div className="p-4"><Filters f={f} set={set}/></div>
                  <div className="sticky bottom-0 flex gap-3 border-t border-bebe bg-card p-4">
                    <Button variant="outline" className="flex-1" onClick={clear}>Clear</Button>
                    <SheetTrigger asChild><Button className="flex-1">Apply</Button></SheetTrigger>
                  </div>
                </SheetContent>
              </Sheet>
              <select aria-label="Sort" value={f.sort ?? "newest"} onChange={(e) => set({ sort: e.target.value })} className="h-11 max-w-full rounded-lg border border-deco bg-card px-3 text-base font-medium md:text-sm">
                <option value="newest">Newest confirmed</option>
                <option value="rent_asc">Lowest rent</option>
                <option value="rent_desc">Highest rent</option>
              </select>
            </div>
          </div>

          {q.isError ? (<div className="rounded-xl bg-card p-10 text-center">
              <p className="text-section">Couldn't load rooms</p>
              <Button className="mt-4" onClick={() => q.refetch()}>Retry</Button>
            </div>) : !q.data ? (<Grid>{Array.from({ length: 8 }).map((_, i) => <RoomCardSkeleton key={i}/>)}</Grid>) : q.data.length === 0 ? (<div className="rounded-xl bg-card p-10 text-center">
              <p className="text-section">No rooms match yet.</p>
              <p className="mt-2 text-foggy">Get a text the moment a matching room opens up.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button variant="brand" onClick={() => gate("Log in to create a vacancy alert.", () => void nav({ to: "/alerts", search: { area: f.area, roomType: f.roomType, maxRent: f.maxRent } }))}>Create a vacancy alert</Button>
                <Button variant="outline" onClick={clear}>Clear filters</Button>
              </div>
            </div>) : (<Grid className={cn("transition-opacity duration-300", q.isFetching && "opacity-60")}>
              {q.data.map((r) => (<div key={r.id} className="animate-in fade-in duration-300"><RoomCard room={r}/></div>))}
            </Grid>)}
        </div>
      </div>
    </div>);
}
function Grid({ children, className }) {
    return <div className={cn("grid grid-cols-1 gap-x-3 gap-y-8 min-[500px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4", className)}>{children}</div>;
}
