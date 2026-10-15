import { usePageMeta } from "@/lib/usePageMeta";
import { useState } from "react";
import { Link } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ErrorCard, StateCard } from "@/components/StateCard";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RequireRole } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { daysSince, getAdminStats, hideListing } from "@/services/api";
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
    const [toHide, setToHide] = useState(null);
    const hide = useMutation({
        mutationFn: (room) => hideListing(room.id),
        onSuccess: async (_d, room) => {
            toast.success("Listing hidden", { description: room.title });
            await Promise.all(["admin-stats", "rooms", "room", "my-listings", "saved-rooms"].map((k) => qc.invalidateQueries({ queryKey: [k] })));
        },
        onError: () => toast.error("Couldn't hide the listing. Try again."),
        onSettled: () => setToHide(null),
    });
    const stats = q.data;
    const cards = [
        { label: "Total listings", value: stats?.totalListings },
        { label: "Current vacancies", value: stats?.vacancies },
        { label: "Contacts made", value: stats?.contactsMade },
        { label: "Stale listings", value: stats?.staleListings },
        { label: "Open reports", value: stats?.openReports },
    ];
    return (<div className="page-container py-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-page">Dashboard</h1>
        <Button asChild variant="outline"><Link to="/admin/verification">Verification queue</Link></Button>
      </div>

      {q.isError ? (<div className="mt-6"><ErrorCard title="We couldn't load the dashboard" onRetry={() => void q.refetch()}/></div>) : (<>
          <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {cards.map((c) => (<div key={c.label} className="rounded-xl bg-card p-4">
                <dt className="text-foggy">{c.label}</dt>
                <dd className="mt-1 text-page">
                  {c.value === undefined ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-deco align-middle" aria-label="Loading"/> : c.value.toLocaleString("en-KE")}
                </dd>
              </div>))}
          </dl>

          <h2 className="text-section mb-4 mt-12">Stale listings</h2>
          <p className="-mt-2 mb-4 text-foggy">Vacant rooms nobody has confirmed in 14 days or more. Hiding one removes it from the public site; the caretaker still sees it.</p>
          {!stats ? (<div className="h-40 animate-pulse rounded-xl bg-deco" aria-busy="true" aria-label="Loading"/>) : stats.stale.length === 0 ? (<StateCard title="No stale listings" text="Every vacant room has been confirmed in the last 14 days."/>) : (<div className="rounded-xl bg-card p-2 md:p-4">
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
                  {stats.stale.map((r) => (<TableRow key={r.id}>
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
