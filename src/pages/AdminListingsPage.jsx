import { usePageMeta } from "@/lib/usePageMeta";
import { useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminNav } from "@/components/AdminNav";
import { ErrorCard, StateCard } from "@/components/StateCard";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Field, TextInput } from "@/components/forms/Field";
import { RequireRole } from "@/lib/auth";
import { filterAdminListings, isStale } from "@/lib/adminFilters";
import { AREAS, formatKes, roomTypeLabel } from "@/lib/format";
import { adminDeleteListing, adminUpdateListing, getAdminListings, hideListing, restoreListing } from "@/services/api";
const PAGE_META = [{ title: "Listings · Rommie" }, { name: "robots", content: "noindex" }];
const PAGE_SIZE = 40;
const REFRESH = ["admin-listings", "admin-stats", "admin-hidden", "admin-reports", "admin-activity", "rooms", "room", "my-listings", "saved-rooms"];

export default function AdminListingsPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["admin"]}>
      <Listings />
    </RequireRole>);
}
function Pill({ children, strong }) {
    return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${strong ? "border-hof" : "border-bebe text-foggy"}`}>{children}</span>;
}
function Listings() {
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ["admin-listings"], queryFn: getAdminListings });
    const [f, setF] = useState({ q: "", roomType: "", area: "", status: "", visibility: "", stale: false });
    const [shown, setShown] = useState(PAGE_SIZE);
    const [editing, setEditing] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const set = (p) => { setF((cur) => ({ ...cur, ...p })); setShown(PAGE_SIZE); };
    const filtered = useMemo(() => filterAdminListings(q.data ?? [], f), [q.data, f]);
    const anyFilter = !!(f.q || f.roomType || f.area || f.status || f.visibility || f.stale);
    const refresh = () => Promise.all(REFRESH.map((k) => qc.invalidateQueries({ queryKey: [k] })));
    const toggleHidden = useMutation({
        mutationFn: (room) => (room.hidden ? restoreListing(room.id) : hideListing(room.id)),
        onSuccess: (_d, room) => toast.success(room.hidden ? "Listing restored" : "Listing hidden", { description: room.title }),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't update the listing. Try again."),
        onSettled: refresh,
    });
    const remove = useMutation({
        mutationFn: (room) => adminDeleteListing(room.id),
        onSuccess: (_d, room) => toast.success("Listing deleted", { description: room.title }),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't delete the listing. Try again."),
        onSettled: async () => { setToDelete(null); await refresh(); },
    });
    const sel = "h-11 min-w-0 rounded-lg border border-deco bg-card px-3 text-base md:text-sm";
    return (<div className="page-container py-6 md:py-10">
      <AdminNav />
      <h1 className="text-page">Listings</h1>
      <p className="mt-1 text-foggy">Every listing on Rommie, hidden ones included. Hide, restore, fix a price or title, or delete spam.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <input type="search" aria-label="Search listings" placeholder="Search title, area or caretaker" value={f.q} onChange={(e) => set({ q: e.target.value })} className="h-11 w-full min-w-0 rounded-lg border border-deco bg-card px-3 text-base placeholder:text-grey-500 sm:w-72 md:text-sm"/>
        <select aria-label="Room type" value={f.roomType} onChange={(e) => set({ roomType: e.target.value })} className={sel}>
          <option value="">All types</option>
          {Object.entries(roomTypeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select aria-label="Area" value={f.area} onChange={(e) => set({ area: e.target.value })} className={sel}>
          <option value="">All areas</option>
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select aria-label="Status" value={f.status} onChange={(e) => set({ status: e.target.value })} className={sel}>
          <option value="">Vacant or taken</option>
          <option value="Vacant">Vacant</option>
          <option value="Taken">Taken</option>
        </select>
        <select aria-label="Visibility" value={f.visibility} onChange={(e) => set({ visibility: e.target.value })} className={sel}>
          <option value="">Visible or hidden</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
        <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-deco bg-card px-3 text-base md:text-sm">
          <input type="checkbox" className="h-4 w-4 accent-hof" checked={f.stale} onChange={(e) => set({ stale: e.target.checked })}/> Stale only
        </label>
        {anyFilter && <Button variant="outline" className="h-11" onClick={() => set({ q: "", roomType: "", area: "", status: "", visibility: "", stale: false })}>Clear</Button>}
      </div>

      <p className="mt-4 text-foggy" aria-live="polite">{q.data ? `${filtered.length} of ${q.data.length} listings` : "Loading listings"}</p>

      <div className="mt-3">
        {q.isError ? (<ErrorCard title="We couldn't load the listings" onRetry={() => void q.refetch()}/>) : !q.data ? (<div className="h-64 animate-pulse rounded-xl bg-deco" aria-busy="true" aria-label="Loading"/>) : filtered.length === 0 ? (<StateCard title="No listings match" text="Try a different search or clear the filters."/>) : (<div className="rounded-xl bg-card p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Caretaker</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, shown).map((r) => (<TableRow key={r.id}>
                    <TableCell className="max-w-[320px]">
                      <div className="flex items-center gap-3">
                        <img src={r.photos[0]} alt="" loading="lazy" className="h-12 w-14 shrink-0 rounded-lg bg-deco object-cover"/>
                        <div className="min-w-0">
                          <Link to="/rooms/$id" params={{ id: r.id }} className="block truncate font-medium hover:underline">{r.title}</Link>
                          <p className="truncate text-foggy">{r.area} · {roomTypeLabel[r.roomType]}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{r.roomOptions?.length > 1 ? "From " : ""}{formatKes(r.rentKes)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Pill strong={r.status === "Vacant"}>{r.status}</Pill>
                        {r.hidden && <Pill strong>Hidden</Pill>}
                        {isStale(r) && <Pill>Stale</Pill>}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap" title="WhatsApp and Call taps">{r.contactCount}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{r.caretaker.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" className="h-9" onClick={() => setEditing(r)} aria-label={`Edit ${r.title}`}>Edit</Button>
                        <Button variant="outline" size="sm" className="h-9" disabled={toggleHidden.isPending} onClick={() => toggleHidden.mutate(r)} aria-label={`${r.hidden ? "Restore" : "Hide"} ${r.title}`}>{r.hidden ? "Restore" : "Hide"}</Button>
                        <Button variant="outline" size="sm" className="h-9" onClick={() => setToDelete(r)} aria-label={`Delete ${r.title}`}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>
          </div>)}
        {filtered.length > shown && <div className="mt-4 text-center"><Button variant="outline" onClick={() => setShown((n) => n + PAGE_SIZE)}>Show more</Button></div>}
      </div>

      <EditDialog room={editing} onClose={() => setEditing(null)} onSaved={refresh}/>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-xl border-0 shadow-modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>“{toDelete?.title}” will be removed for good and its open reports closed. This can't be undone. To take it off the public site but keep it, hide it instead.</AlertDialogDescription>
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
function EditDialog({ room, onClose, onSaved }) {
    return (<Dialog open={!!room} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[95dvh] overflow-y-auto rounded-xl border-0 shadow-modal sm:max-w-lg">
        {room && <EditForm key={room.id} room={room} onClose={onClose} onSaved={onSaved}/>}
      </DialogContent>
    </Dialog>);
}
function EditForm({ room, onClose, onSaved }) {
    const hostel = !!room.roomOptions?.length;
    const [title, setTitle] = useState(room.title);
    const [description, setDescription] = useState(room.description);
    const [rent, setRent] = useState(String(room.rentKes));
    const [error, setError] = useState();
    const save = useMutation({
        mutationFn: () => adminUpdateListing(room.id, { title, description, ...(hostel ? {} : { rentKes: Number(rent.replace(/,/g, "")) }) }),
        onSuccess: async () => { toast.success("Listing updated", { description: title.trim() }); await onSaved(); onClose(); },
        onError: (e) => setError(e instanceof Error ? e.message : "Couldn't save. Try again."),
    });
    return (<form noValidate onSubmit={(e) => { e.preventDefault(); setError(undefined); save.mutate(); }} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-section">Edit listing</DialogTitle>
        <DialogDescription>Fix what's wrong. The caretaker still owns the listing and can change it too.</DialogDescription>
      </DialogHeader>
      <Field label="Title" required>{(p) => <TextInput {...p} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}/>}</Field>
      <Field label="Description" optional>{(p) => <Textarea {...p} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-lg"/>}</Field>
      <Field label="Rent per month (KES)" hint={hostel ? "Hostel rent comes from the room options. Ask the caretaker to edit those." : undefined}>
        {(p) => <TextInput {...p} inputMode="numeric" value={rent} disabled={hostel} onChange={(e) => setRent(e.target.value)}/>}
      </Field>
      {error && <p role="alert" className="text-sm font-medium">{error}</p>}
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
      </DialogFooter>
    </form>);
}
