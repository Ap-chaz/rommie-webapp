import { usePageMeta } from "@/lib/usePageMeta";
import { useState } from "react";
import { Link } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminNav } from "@/components/AdminNav";
import { ErrorCard, StateCard } from "@/components/StateCard";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RequireRole } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { daysSince, getAdminStats, getHiddenListings, hideListing, restoreListing } from "@/services/api";
const PAGE_META = [{ title: "Admin Dashboard · Rommie" }, { name: "robots", content: "noindex" }];

export default function AdminDashboardPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["admin"]}>
      <Dashboard />
    </RequireRole>);
}
function Dashboard() {
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ["admin-stats"], queryFn: getAdminStats });
    const hiddenQ = useQuery({ queryKey: ["admin-hidden"], queryFn: getHiddenListings });
    const [toHide, setToHide] = useState(null);
    const [staleKind, setStaleKind] = useState("all");
    const hide = useMutation({
        mutationFn: (room) => hideListing(room.id),
        onSuccess: async (_d, room) => {
            toast.success("Listing hidden", { description: room.title });
            await Promise.all(["admin-stats", "admin-hidden", "admin-reports", "admin-activity", "rooms", "room", "my-listings", "saved-rooms"].map((k) => qc.invalidateQueries({ queryKey: [k] })));
        },
        onError: () => toast.error("Couldn't hide the listing. Try again."),
        onSettled: () => setToHide(null),
    });
    const restore = useMutation({
        mutationFn: (room) => restoreListing(room.id),
        onSuccess: async (_d, room) => {
            toast.success("Listing restored", { description: room.title });
            await Promise.all(["admin-stats", "admin-hidden", "admin-activity", "rooms", "room", "my-listings", "saved-rooms"].map((k) => qc.invalidateQueries({ queryKey: [k] })));
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't restore the listing. Try again."),
    });
    const stats = q.data;
    const staleRows = (stats?.stale ?? []).filter((r) => staleKind === "all" || (staleKind === "hostel" ? r.roomType === "hostel" : r.roomType !== "hostel"));
    const cards = [
        { label: "Total listings", value: stats?.totalListings },
        { label: "Current vacancies", value: stats?.vacancies },
        { label: "Contacts made", value: stats?.contactsMade },
        { label: "Stale listings", value: stats?.staleListings },
        { label: "Open reports", value: stats?.openReports, to: "/admin/reports" },
        { label: "Hidden listings", value: stats?.hiddenListings },
    ];
    return (<div className="page-container py-6 md:py-10">
      <AdminNav />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-page">Dashboard</h1>
      </div>

      {q.isError ? (<div className="mt-6"><ErrorCard title="We couldn't load the dashboard" onRetry={() => void q.refetch()}/></div>) : (<>
          <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {cards.map((c) => (<div key={c.label} className="rounded-xl bg-card p-4">
                <dt className="text-foggy">{c.to ? <Link to={c.to} className="underline">{c.label}</Link> : c.label}</dt>
                <dd className="mt-1 text-page">
                  {c.value === undefined ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-deco align-middle" aria-label="Loading"/> : c.value.toLocaleString("en-KE")}
                </dd>
              </div>))}
          </dl>

          <h2 className="text-section mb-4 mt-12">Stale listings</h2>
          <p className="-mt-2 mb-4 text-foggy">Vacant rooms nobody has confirmed in 14 days or more. Hiding one removes it from the public site; the caretaker still sees it.</p>
          <label className="mb-4 block">
            <span className="sr-only">Show stale listings of type</span>
            <select value={staleKind} onChange={(e) => setStaleKind(e.target.value)} className="min-h-11 rounded-lg border border-bebe bg-card px-3 md:min-h-10">
              <option value="all">All types ({stats?.stale.length ?? 0})</option>
              <option value="hostel">Hostels ({stats?.stale.filter((r) => r.roomType === "hostel").length ?? 0})</option>
              <option value="other">Rooms and apartments ({stats?.stale.filter((r) => r.roomType !== "hostel").length ?? 0})</option>
            </select>
          </label>
          {!stats ? (<div className="h-40 animate-pulse rounded-xl bg-deco" aria-busy="true" aria-label="Loading"/>) : staleRows.length === 0 ? (<StateCard title="No stale listings" text={staleKind === "all" ? "Every vacant room has been confirmed in the last 14 days." : "None of this type need reconfirming."}/>) : (<div className="rounded-xl bg-card p-2 md:p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Caretaker</TableHead>
                    <TableHead>Last confirmed</TableHead>
                    <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staleRows.map((r) => (<TableRow key={r.id}>
                      <TableCell className="max-w-[260px] truncate font-medium">
                        <Link to="/rooms/$id" params={{ id: r.id }} className="hover:underline">{r.title}</Link>
                      </TableCell>
                      <TableCell>{r.area}</TableCell>
                      <TableCell>{r.caretaker.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{daysSince(r.lastConfirmedVacantAt)} days ago <span className="text-foggy">({shortDate(r.lastConfirmedVacantAt)})</span></TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="h-9" onClick={() => setToHide(r)} aria-label={`Hide ${r.title}`}>Hide</Button>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>
            </div>)}

          <h2 className="text-section mb-4 mt-12">Hidden listings</h2>
          <p className="-mt-2 mb-4 text-foggy">Taken off the public site. Restoring one puts it back in search; if it is stale it shows “Needs reconfirming” until the caretaker confirms.</p>
          {hiddenQ.isError ? (<ErrorCard title="We couldn't load hidden listings" onRetry={() => void hiddenQ.refetch()}/>) : !hiddenQ.data ? (<div className="h-24 animate-pulse rounded-xl bg-deco" aria-busy="true" aria-label="Loading"/>) : hiddenQ.data.length === 0 ? (<StateCard title="Nothing is hidden" text="Listings you hide will show up here so you can restore them."/>) : (<ul className="space-y-3">
              {hiddenQ.data.map((r) => (<li key={r.id} className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link to="/rooms/$id" params={{ id: r.id }} className="block truncate font-medium hover:underline">{r.title}</Link>
                    <p className="text-foggy">{r.area} · {r.caretaker.name} · last confirmed {shortDate(r.lastConfirmedVacantAt)}</p>
                  </div>
                  <Button variant="outline" className="shrink-0" disabled={restore.isPending} onClick={() => restore.mutate(r)} aria-label={`Restore ${r.title}`}>Restore</Button>
                </li>))}
            </ul>)}
        </>)}

      <AlertDialog open={!!toHide} onOpenChange={(o) => !o && setToHide(null)}>
        <AlertDialogContent className="rounded-xl border-0 shadow-modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Hide this listing?</AlertDialogTitle>
            <AlertDialogDescription>“{toHide?.title}” will disappear from search and room pages. {toHide?.caretaker.name} will still see it in My Listings.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep visible</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); if (toHide)
        hide.mutate(toHide); }} disabled={hide.isPending}>
              {hide.isPending ? "Hiding…" : "Hide listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
