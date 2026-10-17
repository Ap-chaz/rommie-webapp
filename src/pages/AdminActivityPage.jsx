import { usePageMeta } from "@/lib/usePageMeta";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorCard, StateCard } from "@/components/StateCard";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { RequireRole } from "@/lib/auth";
import { ACTIVITY_GROUPS, filterActivity } from "@/lib/adminFilters";
import { getActivity } from "@/services/api";
const PAGE_META = [{ title: "Activity · Rommie" }, { name: "robots", content: "noindex" }];
const PAGE_SIZE = 50;
const when = (iso) => new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AdminActivityPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["admin"]}>
      <Activity />
    </RequireRole>);
}
function Activity() {
    const q = useQuery({ queryKey: ["admin-activity"], queryFn: () => getActivity() });
    const [group, setGroup] = useState("all");
    const [shown, setShown] = useState(PAGE_SIZE);
    const list = useMemo(() => filterActivity(q.data ?? [], group), [q.data, group]);
    return (<div className="page-container max-w-[900px] py-6 md:py-10">
      <AdminNav />
      <h1 className="text-page">Activity</h1>
      <p className="mt-1 text-foggy">What admins have changed, newest first. The last 500 actions are kept.</p>
      <label className="mt-6 block">
        <span className="sr-only">Show</span>
        <select value={group} onChange={(e) => { setGroup(e.target.value); setShown(PAGE_SIZE); }} className="min-h-11 rounded-lg border border-bebe bg-card px-3 md:min-h-10">
          <option value="all">All activity</option>
          {ACTIVITY_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
      </label>
      <div className="mt-6">
        {q.isError ? (<ErrorCard title="We couldn't load the activity" onRetry={() => void q.refetch()}/>) : !q.data ? (<div className="space-y-3" aria-busy="true" aria-label="Loading">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-deco"/>)}</div>) : list.length === 0 ? (<StateCard title="Nothing here yet." text="Hiding a listing, handling a report or approving someone will show up here."/>) : (<>
            <ul className="space-y-2">
              {list.slice(0, shown).map((a) => (<li key={a.id} className="rounded-xl bg-card p-4">
                  <p className="text-base">{a.summary}</p>
                  <p className="text-foggy">{a.actor} · {when(a.at)}</p>
                </li>))}
            </ul>
            {list.length > shown && (<div className="mt-4 text-center"><Button variant="outline" onClick={() => setShown((n) => n + PAGE_SIZE)}>Show more ({list.length - shown} left)</Button></div>)}
          </>)}
      </div>
    </div>);
}
