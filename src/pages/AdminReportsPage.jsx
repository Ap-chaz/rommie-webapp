import { usePageMeta } from "@/lib/usePageMeta";
import { useState } from "react";
import { Link } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EyeOff, Flag } from "lucide-react";
import { toast } from "sonner";
import { AdminNav } from "@/components/AdminNav";
import { ErrorCard, StateCard } from "@/components/StateCard";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequireRole } from "@/lib/auth";
import { roomTypeLabel, shortDate } from "@/lib/format";
import { getReports, reviewReport } from "@/services/api";
const PAGE_META = [{ title: "Reports · Rommie" }, { name: "robots", content: "noindex" }];
const tabClass = "shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-1 text-base text-foggy data-[state=active]:border-hof data-[state=active]:text-hof data-[state=active]:shadow-none";

export default function AdminReportsPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["admin"]}>
      <Reports />
    </RequireRole>);
}
const handledText = (r) => {
    const by = r.handledBy ? ` by ${r.handledBy}` : "";
    const on = r.handledAt ? ` on ${shortDate(r.handledAt)}` : "";
    if (r.action === "hidden")
        return `Listing hidden${by}${on}`;
    if (r.action === "deleted")
        return `Listing deleted${by}${on}`;
    if (r.action === "dismissed")
        return `Dismissed${by}${on}`;
    return `Marked resolved${by}${on}`;
};
function Reports() {
    const qc = useQueryClient();
    const open = useQuery({ queryKey: ["admin-reports", "open"], queryFn: () => getReports("open") });
    const handled = useQuery({ queryKey: ["admin-reports", "handled"], queryFn: () => getReports("handled") });
    const [toHide, setToHide] = useState(null);
    const decide = useMutation({
        mutationFn: ({ report, decision }) => reviewReport(report.id, decision),
        onSuccess: async (_d, { report, decision }) => {
            toast.success(decision === "hidden" ? "Listing hidden" : decision === "dismissed" ? "Report dismissed" : "Marked resolved", { description: report.room?.title });
            await Promise.all(["admin-reports", "admin-stats", "admin-hidden", "rooms", "room", "my-listings", "saved-rooms", "admin-activity"].map((k) => qc.invalidateQueries({ queryKey: [k] })));
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save the decision. Try again."),
        onSettled: () => setToHide(null),
    });
    const busy = decide.isPending;
    const card = (r, withActions) => (<li key={r.id} className="rounded-xl bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-hof px-2.5 py-0.5 text-xs font-semibold">{r.reason}</span>
            <span className="text-foggy">{shortDate(r.createdAt)}</span>
          </p>
          {r.room ? (<p className="mt-2 text-base font-medium">
              <Link to="/rooms/$id" params={{ id: r.room.id }} className="hover:underline">{r.room.title}</Link>
            </p>) : <p className="mt-2 text-base font-medium">Listing no longer exists</p>}
          {r.room && (<p className="text-foggy">{r.room.area} · {roomTypeLabel[r.room.roomType]} · {r.room.caretaker.name}{r.room.hidden ? " · Hidden" : ""}</p>)}
        </div>
        {withActions && r.openOnRoom > 1 && (<span className="flex items-center gap-1.5 text-sm font-medium"><Flag className="h-4 w-4" aria-hidden/> {r.openOnRoom} open reports on this listing</span>)}
      </div>
      {r.note && <p className="mt-3 rounded-[8px] bg-faint p-3 break-words">“{r.note}”</p>}
      {withActions ? (<div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => decide.mutate({ report: r, decision: "dismissed" })}>Dismiss</Button>
          <Button variant="outline" disabled={busy} onClick={() => decide.mutate({ report: r, decision: "resolved" })}>Mark resolved</Button>
          {r.room && !r.room.hidden && (<Button disabled={busy} onClick={() => setToHide(r)}><EyeOff /> Hide listing</Button>)}
        </div>) : (<p className="mt-3 text-sm text-foggy">{handledText(r)}</p>)}
    </li>);
    const list = (q, withActions, empty) => q.isError ? (<ErrorCard title="We couldn't load the reports" onRetry={() => void q.refetch()}/>) : !q.data ? (<div className="space-y-3" aria-busy="true" aria-label="Loading"><div className="h-32 animate-pulse rounded-xl bg-deco"/><div className="h-32 animate-pulse rounded-xl bg-deco"/></div>) : q.data.length === 0 ? (<StateCard title={empty}/>) : (<ul className="space-y-3">{q.data.map((r) => card(r, withActions))}</ul>);
    return (<div className="page-container max-w-[900px] py-6 md:py-10">
      <AdminNav />
      <h1 className="text-page">Reports</h1>
      <p className="mt-1 text-foggy">What students flagged. Hiding a listing also closes every other open report about it.</p>
      <Tabs defaultValue="open" className="mt-6">
        <TabsList className="no-scrollbar h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-bebe bg-transparent p-0">
          <TabsTrigger value="open" className={tabClass}>Open ({open.data?.length ?? "…"})</TabsTrigger>
          <TabsTrigger value="handled" className={tabClass}>Handled ({handled.data?.length ?? "…"})</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-6">{list(open, true, "No open reports.")}</TabsContent>
        <TabsContent value="handled" className="mt-6">{list(handled, false, "Nothing handled yet.")}</TabsContent>
      </Tabs>

      <AlertDialog open={!!toHide} onOpenChange={(o) => !o && setToHide(null)}>
        <AlertDialogContent className="rounded-xl border-0 shadow-modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Hide this listing?</AlertDialogTitle>
            <AlertDialogDescription>“{toHide?.room?.title}” will disappear from search and room pages, and every open report about it will be closed. {toHide?.room?.caretaker.name} will still see it in My Listings.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep visible</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); if (toHide)
        decide.mutate({ report: toHide, decision: "hidden" }); }} disabled={busy}>
              {busy ? "Hiding…" : "Hide listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
