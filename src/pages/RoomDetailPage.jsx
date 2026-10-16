import { usePageMeta } from "@/lib/usePageMeta";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/router";
import { useParams } from "react-router-dom";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { BadgeCheck, Bus, Droplets, Flag, Footprints, Grid2x2, ChevronLeft, ChevronRight, Heart, MapPin, MessageCircle, Phone, ShieldCheck, Wifi, X, Zap } from "lucide-react";
import { useSaved } from "@/lib/saved";
import { daysSince, getBuildingRooms, getRoom } from "@/services/api";
import { StatusLine } from "@/components/RoomCard";
import { ReportModal } from "@/components/ReportModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { hostelOffers } from "@/components/HostelFacts";
import { campusShort, daysAgoLabel, formatKes, optionPrice, roomTypeLabel, whatsappLink } from "@/lib/format";
const roomQuery = (id) => queryOptions({ queryKey: ["room", id], queryFn: () => getRoom(id) });
const amenityIcon = { "Water 24/7": Droplets, WiFi: Wifi, Tokens: Zap, "Gated Security": ShieldCheck };
const amenityLabel = { "Water 24/7": "Water 24/7", WiFi: "WiFi Available", Tokens: "Tokens (prepaid power)", "Gated Security": "Gated Security" };
function Photo({ src, alt, className, onClick }) {
    const [err, setErr] = useState(false);
    return (<button onClick={onClick} className={`overflow-hidden bg-deco ${className}`} aria-label={`Open ${alt}`}>
      {err ? <div className="flex h-full w-full items-center justify-center text-foggy">Photo unavailable</div> :
            <img src={src} alt={alt} onError={() => setErr(true)} className="h-full w-full object-cover transition-opacity hover:opacity-90" width={816} height={816}/>}
    </button>);
}
/** Full-screen photo viewer: one photo at a time, arrows / swipe / keyboard to move, thumbnails to jump. */
function Lightbox({ photos, title, index, onIndex, onClose }) {
    const open = index !== null;
    const i = index ?? 0;
    const n = photos.length;
    const go = (d) => onIndex((i + d + n) % n);
    const touchX = useRef(null);
    const strip = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === "ArrowRight")
                go(1);
            else if (e.key === "ArrowLeft")
                go(-1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, i, n]);
    useEffect(() => {
        strip.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }, [i, open]);
    const arrow = "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-white/30 active:scale-95 md:h-12 md:w-12 md:bg-white/15";
    return (<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="left-0 top-0 flex h-dvh max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-black p-0 shadow-none sm:p-0 [&>button]:hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogTitle className="sr-only">{title} photos</DialogTitle>
        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
          <button onClick={onClose} aria-label="Close photos" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/15"><X className="h-6 w-6"/></button>
          <span className="text-sm font-medium tabular-nums">{i + 1} / {n}</span>
          <span className="w-11" aria-hidden/>
        </div>

        <div className="relative min-h-0 flex-1" onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }} onTouchEnd={(e) => {
            const start = touchX.current;
            touchX.current = null;
            const end = e.changedTouches[0]?.clientX;
            if (start === null || end === undefined || n < 2)
                return;
            if (Math.abs(end - start) > 50)
                go(end < start ? 1 : -1);
        }}>
          <img key={i} src={photos[i]} alt={`${title}, photo ${i + 1}`} className="animate-in fade-in absolute inset-0 h-full w-full object-contain duration-200" draggable={false}/>
          {n > 1 && (<>
              <button onClick={() => go(-1)} aria-label="Previous photo" className={cn(arrow, "left-2 md:left-4")}><ChevronLeft className="h-6 w-6"/></button>
              <button onClick={() => go(1)} aria-label="Next photo" className={cn(arrow, "right-2 md:right-4")}><ChevronRight className="h-6 w-6"/></button>
            </>)}
        </div>

        {n > 1 && (<div ref={strip} className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:justify-center">
            {photos.map((p, k) => (<button key={k} data-i={k} onClick={() => onIndex(k)} aria-label={`Show photo ${k + 1}`} aria-current={k === i} className={cn("h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-opacity", k === i ? "border-white" : "border-transparent opacity-50 hover:opacity-100")}>
                <img src={p} alt="" className="h-full w-full object-cover" loading="lazy"/>
              </button>))}
          </div>)}
      </DialogContent>
    </Dialog>);
}
export default function RoomDetailPage() {
    const { id } = useParams();
    const q = useQuery(roomQuery(id));
    const room = q.data;
    usePageMeta(room
        ? (() => {
            const t = `${room.title} · Rommie`;
            const d = `${formatKes(room.rentKes)}/month in ${room.area}. Contact the caretaker directly on Rommie.`;
            return [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }];
        })()
        : [{ title: "Room · Rommie" }, { name: "description", content: "Room details on Rommie." }]);
    const [lightbox, setLightbox] = useState(null);
    const [optBox, setOptBox] = useState(null);
    const [report, setReport] = useState(false);
    const [slide, setSlide] = useState(0);
    const slider = useRef(null);
    const slideBy = (d) => {
        const el = slider.current;
        if (el)
            el.scrollTo({ left: (Math.round(el.scrollLeft / el.clientWidth) + d) * el.clientWidth, behavior: "smooth" });
    };
    const { isSaved, toggle } = useSaved();
    const building = useQuery({ queryKey: ["building", room?.buildingId, room?.id], queryFn: () => getBuildingRooms(room.buildingId, room.id), enabled: !!room?.buildingId });
    if (q.isLoading) {
        return (<div className="page-container max-w-[1180px] py-6" aria-busy="true" aria-label="Loading room">
        <div className="h-9 w-72 max-w-full animate-pulse rounded-lg bg-deco"/>
        <div className="mt-6 h-[340px] animate-pulse rounded-xl bg-deco lg:h-[460px]"/>
      </div>);
    }
    if (q.isError) {
        return (<div className="page-container py-20 text-center">
        <h1 className="text-page">Couldn't load this room</h1>
        <Button className="mt-6" onClick={() => void q.refetch()}>Retry</Button>
      </div>);
    }
    if (!room) {
        return (<div className="page-container py-20 text-center">
        <h1 className="text-page">Room not found</h1>
        <p className="mt-2 text-foggy">It may have been removed by the caretaker.</p>
        <Button asChild className="mt-6"><Link to="/rooms">Browse rooms</Link></Button>
      </div>);
    }
    const saved = isSaved(room.id);
    const save = () => toggle(room.id);
    const days = daysSince(room.lastConfirmedVacantAt);
    const offers = [
        ...room.amenities.map((a) => ({ key: a, Icon: amenityIcon[a], label: amenityLabel[a] })),
        ...hostelOffers(room),
    ];
    return (<div className="page-container max-w-[1180px] py-6 pb-10">
      <h1 className="text-page">{room.title}</h1>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-foggy">{room.area} · {roomTypeLabel[room.roomType]}</p>
        <div className="flex gap-1">
          <button onClick={save} aria-pressed={saved} className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-medium underline hover:bg-card"><Heart className={saved ? "h-4 w-4 fill-rausch stroke-rausch" : "h-4 w-4"}/> {saved ? "Saved" : "Save Room"}</button>
          <button onClick={() => setReport(true)} className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-medium underline hover:bg-card"><Flag className="h-4 w-4"/> Report</button>
        </div>
      </div>

      {/* Desktop gallery */}
      <div className="relative mt-6 hidden h-[340px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl md:grid lg:h-[460px]">
        <Photo src={room.photos[0] ?? ""} alt="photo 1" className="col-span-2 row-span-2" onClick={() => setLightbox(0)}/>
        {room.photos.slice(1, 5).map((p, i) => <Photo key={i} src={p} alt={`photo ${i + 2}`} onClick={() => setLightbox(i + 1)}/>)}
        <Button variant="outline" className="absolute bottom-4 right-4 bg-card" onClick={() => setLightbox(0)}><Grid2x2 /> Show all photos</Button>
      </div>
      {/* Mobile carousel */}
      <div className="relative -mx-4 mt-4 md:hidden">
        <div ref={slider} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
          {room.photos.map((p, i) => <Photo key={i} src={p} alt={`photo ${i + 1}`} className="aspect-[4/3] w-full shrink-0 snap-center" onClick={() => setLightbox(i)}/>)}
        </div>
        <span className="absolute bottom-3 right-3 rounded-md bg-hof/70 px-2 py-1 text-xs text-primary-foreground">{slide + 1} / {room.photos.length}</span>
        {room.photos.length > 1 && (<>
            <button onClick={() => slideBy(-1)} disabled={slide === 0} aria-label="Previous photo" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 shadow-md transition-opacity active:scale-95 disabled:pointer-events-none disabled:opacity-0">
              <ChevronLeft className="h-5 w-5"/>
            </button>
            <button onClick={() => slideBy(1)} disabled={slide >= room.photos.length - 1} aria-label="Next photo" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 shadow-md transition-opacity active:scale-95 disabled:pointer-events-none disabled:opacity-0">
              <ChevronRight className="h-5 w-5"/>
            </button>
          </>)}
      </div>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-bebe">
          <section className="pb-6">
            <div className="text-base"><StatusLine room={room}/></div>
            {room.status === "Vacant" && <p className="mt-1 text-foggy">Confirmed vacant {daysAgoLabel(days)}</p>}
            <p className="mt-4 break-words">{room.description}</p>
          </section>

          {room.roomOptions?.length > 0 && (<section className="py-6">
              <h2 className="text-section mb-4">Room options & prices</h2>
              <ul className="divide-y divide-bebe rounded-xl border border-bebe">
                {room.roomOptions.map((o, oi) => (<li key={o.label} className="flex items-center gap-4 px-4 py-3">
                    {o.photos?.length > 0 && (<button type="button" onClick={() => setOptBox({ i: oi, index: 0 })} className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-deco" aria-label={`See ${o.photos.length} photo${o.photos.length > 1 ? "s" : ""} of ${o.label}`}>
                        <img src={o.photos[0]} alt={`${o.label} room`} loading="lazy" className="h-full w-full object-cover"/>
                        {o.photos.length > 1 && <span className="absolute bottom-0.5 right-0.5 rounded bg-hof/80 px-1 text-[11px] font-medium text-primary-foreground">{o.photos.length}</span>}
                      </button>)}
                    <span className="min-w-0 flex-1">{o.label}</span>
                    <span className="shrink-0 text-right font-semibold">{optionPrice(o)}</span>
                  </li>))}
              </ul>
              {room.registrationFeeKes ? <p className="mt-3"><span className="text-foggy">Registration fee: </span>{formatKes(room.registrationFeeKes)} (non-refundable)</p> : null}
              {room.notes && <p className="mt-3 text-foggy">{room.notes}</p>}
              {room.inGuide && <p className="mt-3 flex items-center gap-1.5 text-sm font-medium"><ShieldCheck className="h-4 w-4"/> Listed in the Karen Campus private hostels guide (2025)</p>}
              <p className="mt-3 text-sm text-foggy">Get a signed agreement that states the rent, services and deposit before you pay.</p>
            </section>)}

          <section className="py-6">
            <h2 className="text-section mb-4">Rent & terms</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div><dt className="text-foggy">Rent</dt><dd className="font-semibold">{room.roomOptions?.length > 1 ? "From " : ""}{formatKes(room.rentKes)} /month</dd></div>
              <div><dt className="text-foggy">Deposit</dt><dd>{room.depositTerms}</dd></div>
              <div><dt className="text-foggy">Area</dt><dd>{room.area}</dd></div>
              <div><dt className="text-foggy">Room type</dt><dd>{roomTypeLabel[room.roomType]}</dd></div>
            </dl>
          </section>

          <section className="py-6">
            <h2 className="text-section mb-4">Getting to campus</h2>
            <ul className="space-y-3">
              {room.distanceLabel && <li className="flex items-center gap-3"><Footprints className="h-5 w-5" strokeWidth={1.5}/> {room.distanceLabel}</li>}
              {Object.entries(room.distances).filter(([, d]) => d?.walkMin || d?.matatuMin).map(([c, d]) => (<li key={c} className="flex items-center gap-3">
                  {d.walkMin ? <Footprints className="h-5 w-5" strokeWidth={1.5}/> : <Bus className="h-5 w-5" strokeWidth={1.5}/>}
                  {d.walkMin ? `${d.walkMin} mins walk to ${campusShort(c)}` : `${d.matatuMin} mins matatu to ${campusShort(c)}`}
                </li>))}
              {room.matatuFareKes > 0 && <li className="text-foggy">Matatu fare to campus: about {formatKes(room.matatuFareKes)}</li>}
            </ul>
            <a href={room.mapLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 font-medium underline"><MapPin className="h-4 w-4"/> Open in Google Maps</a>
          </section>

          {offers.length > 0 && (<section className="py-6">
            <h2 className="text-section mb-2">What this place offers</h2>
            <ul className="divide-y divide-bebe">
              {offers.map(({ key, Icon, label }) => (<li key={key} className="flex items-center gap-4 py-3.5 text-base"><Icon className="h-6 w-6" strokeWidth={1.5}/> {label}</li>))}
            </ul>
          </section>)}

          {building.data?.length > 0 && (<section className="py-6">
              <h2 className="text-section mb-2">Other rooms in this building</h2>
              <ul className="divide-y divide-bebe rounded-xl border border-bebe">
                {building.data.map((r) => (<li key={r.id}>
                    <Link to="/rooms/$id" params={{ id: r.id }} className="flex items-center gap-4 px-4 py-3 hover:bg-faint">
                      <img src={r.photos[0]} alt="" loading="lazy" className="h-14 w-16 shrink-0 rounded-lg bg-deco object-cover"/>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{roomTypeLabel[r.roomType]}</span>
                        <span className="block text-foggy">{r.status === "Vacant" ? "Vacant" : "Taken"}</span>
                      </span>
                      <span className="shrink-0 font-semibold">{formatKes(r.rentKes)}<span className="font-normal text-foggy">/mo</span></span>
                    </Link>
                  </li>))}
              </ul>
            </section>)}

          <section className="py-6">
            <h2 className="text-section mb-4">Your caretaker</h2>
            <div className="flex items-center gap-3 rounded-xl bg-card p-4 sm:gap-4 sm:p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-hof text-xl font-semibold text-primary-foreground">{room.caretaker.name[0]}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium">{room.caretaker.name}</p>
                {room.caretaker.verified ? (<p className="flex items-center gap-1 text-sm"><BadgeCheck className="h-4 w-4"/> Verified Caretaker</p>) : <p className="text-sm text-foggy">Not verified yet</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-section">{room.caretaker.trustScore}</p>
                <p className="text-xs text-foggy">Trust score</p>
              </div>
            </div>
          </section>

          <section className="py-6">
            <div className="flex gap-3 rounded-xl bg-card p-5">
              <ShieldCheck className="h-6 w-6 shrink-0" strokeWidth={1.5}/>
              <p>Never pay before viewing. Visit with a friend and confirm the caretaker's identity.</p>
            </div>
          </section>

          <section className="pt-6 lg:hidden">
            <div className="rounded-xl border border-bebe bg-card p-5">
              <p className="text-section"><span className="font-semibold">{formatKes(room.rentKes)}</span> <span className="text-base text-foggy">/month</span></p>
              <p className="mt-1 text-foggy">{room.depositTerms}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button asChild size="lg" className="w-full"><a href={whatsappLink(room)} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
                <Button asChild variant="outline" size="lg" className="w-full"><a href={`tel:${room.callNumber}`}><Phone /> Call</a></Button>
              </div>
            </div>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+1.5rem)] rounded-xl border border-bebe bg-card p-6 shadow-search">
            <p className="text-section"><span className="font-semibold">{formatKes(room.rentKes)}</span> <span className="text-base text-foggy">/month</span></p>
            <p className="mt-1 text-foggy">{room.depositTerms}</p>
            <div className="mt-5 space-y-3">
              <Button asChild className="w-full" size="lg"><a href={whatsappLink(room)} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
              <Button asChild variant="outline" className="w-full" size="lg"><a href={`tel:${room.callNumber}`}><Phone /> Call</a></Button>
            </div>
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <button onClick={save} className="font-medium underline">{saved ? "Saved" : "Save"}</button>
              <button onClick={() => setReport(true)} className="font-medium underline">Report</button>
            </div>
          </div>
        </aside>
      </div>

      <Lightbox photos={room.photos} title={room.title} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)}/>
      {optBox && <Lightbox photos={room.roomOptions[optBox.i].photos} title={`${room.title} · ${room.roomOptions[optBox.i].label}`} index={optBox.index} onIndex={(index) => setOptBox((b) => ({ ...b, index }))} onClose={() => setOptBox(null)}/>}
      <ReportModal roomId={room.id} open={report} onOpenChange={setReport}/>
    </div>);
}
