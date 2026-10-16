import { usePageMeta } from "@/lib/usePageMeta";
import { useState } from "react";
import { Link } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { RequireRole, useAuth } from "@/lib/auth";
import { daysAgoLabel, formatKes, roomTypeLabel, STALE_DAYS } from "@/lib/format";
import { daysSince, deleteListing, getMyListings, reconfirmRoom, setRoomStatus, updateListing } from "@/services/api";
import { cn } from "@/lib/utils";
const PAGE_META = [{ title: "My Listings · Rommie" }, { name: "robots", content: "noindex" }];

export default function CaretakerListingsPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["caretaker"]} loginPath="/caretaker/login">
      <Listings />
    </RequireRole>);
}
function Listings() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const key = ["my-listings", user?.id];
    const q = useQuery({ queryKey: key, queryFn: () => getMyListings(user.id), enabled: !!user });
    const [toDelete, setToDelete] = useState(null);
    const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["my-listings"] }), qc.invalidateQueries({ queryKey: ["rooms"] }), qc.invalidateQueries({ queryKey: ["room"] })]);
    const patchCache = (id, p) => qc.setQueryData(key, (cur) => cur?.map((r) => (r.id === id ? { ...r, ...p } : r)));
    /** Optimistic status change with an undo that restores both status and confirmed date. */
    const toggle = useMutation({
        mutationFn: ({ room, status }) => setRoomStatus(room.id, status),
        onMutate: async ({ room, status }) => {
            await qc.cancelQueries({ queryKey: key });
            patchCache(room.id, { status, ...(status === "Vacant" ? { lastConfirmedVacantAt: new Date().toISOString() } : {}) });
        },
        onSuccess: (_d, { room, status }) => {
            toast(status === "Taken" ? "Marked as taken" : "Marked as vacant", {
                description: room.title,
                action: {
                    label: "Undo",
                    onClick: async () => {
                        patchCache(room.id, { status: room.status, lastConfirmedVacantAt: room.lastConfirmedVacantAt });
                        try {
                            await updateListing(room.id, { status: room.status, lastConfirmedVacantAt: room.lastConfirmedVacantAt });
                        }
                        catch {
                            toast.error("Couldn't undo. Try again.");
                        }
                        await refresh();
                    },
                },
            });
        },
        onError: (_e, { room }) => {
            patchCache(room.id, { status: room.status, lastConfirmedVacantAt: room.lastConfirmedVacantAt });
            toast.error("Couldn't update the room. Check your connection and try again.");
        },
        onSettled: refresh,
    });
    const reconfirm = useMutation({
        mutationFn: (room) => reconfirmRoom(room.id),
        onMutate: async (room) => {
            await qc.cancelQueries({ queryKey: key });
            patchCache(room.id, { status: "Vacant", lastConfirmedVacantAt: new Date().toISOString() });
        },
        onSuccess: () => toast.success("Thanks. Confirmed vacant today."),
        onError: (_e, room) => {
            patchCache(room.id, { lastConfirmedVacantAt: room.lastConfirmedVacantAt });
            toast.error("Couldn't reconfirm. Try again.");
        },
        onSettled: refresh,
    });
    const remove = useMutation({
        mutationFn: (room) => deleteListing(room.id),
        onSuccess: async (_d, room) => { toast.success("Listing deleted", { description: room.title }); await refresh(); },
        onError: () => toast.error("Couldn't delete the listing. Try again."),
        onSettled: () => setToDelete(null),
    });
    return (<div className="page-container max-w-[900px] py-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-page">My listings</h1>
        <Button asChild><Link to="/caretaker/post"><Plus /> Post a room</Link></Button>
      </div>

      <div className="mt-6 space-y-3">
        {q.isLoading ? (Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-deco"/>)) : q.isError ? (<div className="rounded-xl bg-card p-10 text-center">
            <p className="text-section">We couldn't load your listings.</p>
            <p className="mt-2 text-foggy">Check your connection and try again.</p>
            <Button className="mt-5" onClick={() => void q.refetch()}>Retry</Button>
          </div>) : q.data && q.data.length === 0 ? (<div className="rounded-xl bg-card p-10 text-center">
            <p className="text-section">You haven't posted a room yet</p>
            <p className="mt-2 text-foggy">Add your first vacancy. It takes about two minutes.</p>
            <Button asChild className="mt-5"><Link to="/caretaker/post">Post a Room</Link></Button>
          </div>) : (q.data?.map((room) => (<ListingRow key={room.id} room={room} onToggle={(status) => toggle.mutate({ room, status })} onReconfirm={() => reconfirm.mutate(room)} onDelete={() => setToDelete(room)}/>)))}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-xl border-0 shadow-modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              “{toDelete?.title}” will be removed for good. If it's just rented out, mark it Taken instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); if (toDelete)
        remove.mutate(toDelete); }} disabled={remove.isPending}>
              {remove.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
function ListingRow({ room, onToggle, onReconfirm, onDelete }) {
    const days = daysSince(room.lastConfirmedVacantAt);
    const vacant = room.status === "Vacant";
    const stale = vacant && days >= STALE_DAYS;
    const needsConfirm = vacant && (stale || !!room.hidden);
    return (<article className="rounded-xl bg-card p-4">
      <div className="flex gap-4">
        <img src={room.photos[0]} alt="" width={96} height={96} loading="lazy" className={cn("h-24 w-24 shrink-0 rounded-xl bg-deco object-cover", !vacant && "opacity-70")}/>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium">{room.title}</h2>
          <p className="truncate text-foggy">{room.area} · {roomTypeLabel[room.roomType]}</p>
          <p className="mt-0.5"><span className="font-semibold">{formatKes(room.rentKes)}</span>/month</p>
          {room.hidden ? (<p className="text-foggy"><span className="mr-1 rounded-full border border-hof px-2.5 py-0.5 text-xs font-semibold text-hof">Hidden by Rommie</span> Students can't see this room. Tap "Yes, still vacant" below to bring it back.</p>) : !vacant ? (<p className="text-foggy">Taken · marked {new Date(room.lastConfirmedVacantAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</p>) : stale ? (<span className="mt-1 inline-block rounded-full border border-hof px-2.5 py-0.5 text-xs font-semibold">Needs reconfirming</span>) : (<p className="text-foggy">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-vacant align-middle" aria-hidden/>
              Vacant · confirmed {daysAgoLabel(days)}
            </p>)}
        </div>
      </div>

      {needsConfirm && (<div className="mt-3 flex flex-col gap-3 rounded-[8px] bg-faint p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden/> <span><span className="font-semibold">Still vacant?</span> Last confirmed {days} days ago. {room.hidden ? "Students can't see this room until you confirm." : "Students are told to ask first."}</span></p>
          <Button onClick={onReconfirm} className="shrink-0">Yes, still vacant</Button>
        </div>)}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-bebe pt-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <Switch checked={vacant} onCheckedChange={(on) => onToggle(on ? "Vacant" : "Taken")} aria-label={`${room.title}: ${vacant ? "vacant" : "taken"}`}/>
          <span className="font-medium">{vacant ? "Vacant" : "Taken"}</span>
        </label>
        <div className="flex items-center gap-1">
          <Button asChild variant="outline"><Link to="/caretaker/post" search={{ copy: room.id }}><Plus /> Add another room type</Link></Button>
          <Button asChild variant="outline"><Link to="/caretaker/edit/$id" params={{ id: room.id }}><Pencil /> Edit</Link></Button>
          <Button variant="circle" size="icon" aria-label={`Delete ${room.title}`} onClick={onDelete} className="h-11 w-11"><Trash2 /></Button>
        </div>
      </div>
    </article>);
}
