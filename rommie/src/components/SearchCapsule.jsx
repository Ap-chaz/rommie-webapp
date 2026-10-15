import { useState } from "react";
import { useNavigate } from "@/lib/router";
import { Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AREAS, roomTypeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
const RENTS = [
    { label: "< KES 6,000", max: 6000 },
    { label: "KES 8,000", max: 8000 },
    { label: "KES 10,000+", min: 10000 },
];
const CAMPUSES = ["KSL", "CUEA", "Co-op"];
function Field({ label, placeholder, value, options, onPick, className }) {
    const [open, setOpen] = useState(false);
    return (<Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn("flex min-w-0 flex-1 flex-col items-start rounded-xl px-4 py-3 text-left hover:bg-faint lg:px-5", className)}>
        <span className="max-w-full truncate text-sm font-medium">{label}</span>
        <span className={cn("max-w-full truncate text-sm", value ? "text-hof" : "text-foggy")}>{value ?? placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 rounded-2xl border-0 p-2 shadow-dropdown">
        <button className="w-full rounded-lg px-3 py-2.5 text-left text-foggy hover:bg-faint" onClick={() => { onPick(undefined); setOpen(false); }}>Any</button>
        {options.map((o) => (<button key={o.key} className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-faint" onClick={() => { onPick(o.key); setOpen(false); }}>
            {o.label}
          </button>))}
      </PopoverContent>
    </Popover>);
}
export function SearchCapsule({ compact = false }) {
    const nav = useNavigate();
    const [v, setV] = useState({});
    const submit = () => nav({
        to: "/rooms",
        search: { near: v.near, area: v.area, roomType: v.roomType, maxRent: v.rent && "max" in v.rent ? v.rent.max : undefined, minRent: v.rent && "min" in v.rent ? v.rent.min : undefined },
    });
    const campusOpts = CAMPUSES.map((c) => ({ key: c, label: c }));
    const areaOpts = AREAS.map((a) => ({ key: a, label: a }));
    const rentOpts = RENTS.map((r) => ({ key: r.label, label: r.label }));
    const typeOpts = Object.keys(roomTypeLabel).map((k) => ({ key: k, label: roomTypeLabel[k] }));
    return (<>
      <div className={cn("mx-auto hidden w-full max-w-[920px] items-center rounded-2xl border border-bebe bg-card p-1.5 shadow-search md:flex", compact && "max-w-[720px]")}>
        <Field label="Campus" placeholder="Any campus" value={v.near} options={campusOpts} onPick={(k) => setV({ ...v, near: k })}/>
        <span className="h-8 w-px bg-bebe"/>
        <Field label="Where" placeholder="Search areas" value={v.area} options={areaOpts} onPick={(k) => setV({ ...v, area: k })}/>
        <span className="h-8 w-px bg-bebe"/>
        <Field label="Max rent" placeholder="Add budget" value={v.rent?.label} options={rentOpts} onPick={(k) => setV({ ...v, rent: RENTS.find((r) => r.label === k) })}/>
        <span className="h-8 w-px bg-bebe"/>
        <Field label="Room type" placeholder="Any type" value={v.roomType && roomTypeLabel[v.roomType]} options={typeOpts} onPick={(k) => setV({ ...v, roomType: k })}/>
        <button onClick={submit} aria-label="Search" className="ml-1 flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-rausch px-5 font-medium text-primary-foreground hover:bg-rausch-600">
          <Search className="h-5 w-5" strokeWidth={2.5}/>
          <span className="hidden lg:inline">Search</span>
        </button>
      </div>

      <Sheet>
        <SheetTrigger className="flex w-full items-center gap-3 rounded-2xl border border-bebe bg-card px-5 py-3 text-left shadow-search md:hidden">
          <Search className="h-5 w-5"/>
          <span>
            <span className="block font-medium">Where to?</span>
            <span className="block text-xs text-foggy">{v.near ?? v.area ?? "Any area"} · {v.rent?.label ?? "Any rent"}</span>
          </span>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-dvh bg-faint p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <SheetHeader><SheetTitle>Search rooms</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-4">
            {[
            { l: "Campus", opts: campusOpts, cur: v.near, set: (k) => setV({ ...v, near: k }) },
            { l: "Where", opts: areaOpts, cur: v.area, set: (k) => setV({ ...v, area: k }) },
            { l: "Max rent", opts: rentOpts, cur: v.rent?.label, set: (k) => setV({ ...v, rent: RENTS.find((r) => r.label === k) }) },
            { l: "Room type", opts: typeOpts, cur: v.roomType, set: (k) => setV({ ...v, roomType: k }) },
        ].map((f) => (<div key={f.l} className="rounded-xl bg-card p-4">
                <p className="mb-3 text-base font-medium">{f.l}</p>
                <div className="flex flex-wrap gap-2">
                  {f.opts.map((o) => (<button key={o.key} onClick={() => f.set(f.cur === o.key ? undefined : o.key)} className={cn("min-h-11 rounded-full border px-4 text-sm", f.cur === o.key ? "border-hof bg-hof text-primary-foreground" : "border-deco")}>
                      {o.label}
                    </button>))}
                </div>
              </div>))}
            <Button variant="brand" size="lg" className="w-full" onClick={submit}><Search /> Search</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>);
}
