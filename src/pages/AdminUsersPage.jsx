import { usePageMeta } from "@/lib/usePageMeta";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminNav } from "@/components/AdminNav";
import { ErrorCard, StateCard } from "@/components/StateCard";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequireRole } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { filterUsers } from "@/lib/adminFilters";
import { getAdminUsers, setCaretakerSuspended } from "@/services/api";
const PAGE_META = [{ title: "Users · Rommie" }, { name: "robots", content: "noindex" }];
const tabClass = "shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-1 text-base text-foggy data-[state=active]:border-hof data-[state=active]:bg-transparent data-[state=active]:text-hof data-[state=active]:shadow-none";
const selectClass = "min-h-11 rounded-lg border border-bebe bg-card px-3 md:min-h-10";

export default function AdminUsersPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["admin"]}>
      <Users />
    </RequireRole>);
}
function Users() {
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ["admin-users"], queryFn: getAdminUsers });
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [target, setTarget] = useState(null);
    const act = useMutation({
        mutationFn: ({ user, suspend }) => setCaretakerSuspended(user.id, suspend),
        onSuccess: async (_d, { user, suspend }) => {
            toast.success(suspend ? `${user.name} suspended` : `${user.name} restored`);
            await Promise.all(["admin-users", "admin-stats", "admin-listings", "rooms", "room", "saved-rooms", "admin-activity"].map((k) => qc.invalidateQueries({ queryKey: [k] })));
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save that. Try again."),
        onSettled: () => setTarget(null),
    });
    const caretakers = useMemo(() => filterUsers(q.data?.caretakers ?? [], { q: search, status }), [q.data, search, status]);
    const students = useMemo(() => filterUsers(q.data?.students ?? [], { q: search, status: status === "suspended" ? "none" : status }), [q.data, search, status]);
    const verifiedBadge = (v) => v ? (<span className="inline-flex items-center gap-1 font-medium"><BadgeCheck className="h-4 w-4" aria-hidden/> Verified</span>) : (<span className="text-foggy">Not verified</span>);
    return (<div className="page-container max-w-[1100px] py-6 md:py-10">
      <AdminNav />
      <h1 className="text-page">Users</h1>
      <p className="mt-1 text-foggy">Caretakers, hostels and students. Suspending a caretaker blocks their login and takes their listings off the public site.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search users</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foggy" aria-hidden/>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone" className="min-h-11 w-full rounded-lg border border-bebe bg-card pl-9 pr-3 md:min-h-10"/>
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
            <option value="all">All statuses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Not verified</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
      </div>

      <div className="mt-6">
        {q.isError ? (<ErrorCard title="We couldn't load users" onRetry={() => void q.refetch()}/>) : !q.data ? (<div className="space-y-3" aria-busy="true" aria-label="Loading">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-deco"/>)}</div>) : (<Tabs defaultValue="caretakers">
            <TabsList className="no-scrollbar h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-bebe bg-transparent p-0">
              <TabsTrigger value="caretakers" className={tabClass}>Caretakers & hostels ({caretakers.length})</TabsTrigger>
              <TabsTrigger value="students" className={tabClass}>Students ({students.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="caretakers" className="mt-6">
              {caretakers.length === 0 ? (<StateCard title="No one matches those filters."/>) : (<ul className="space-y-3">
                  {caretakers.map((u) => (<li key={u.id} className="flex flex-col gap-3 rounded-xl bg-card p-4 md:flex-row md:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-medium">
                          {u.name}
                          {u.isHostel && <span className="ml-2 rounded-full bg-faint px-2 py-0.5 text-sm font-normal text-foggy">Hostel</span>}
                          {u.suspended && <span className="ml-2 rounded-full bg-hof px-2 py-0.5 text-sm font-medium text-white">Suspended</span>}
                        </p>
                        <p className="text-foggy">{u.phone} · joined {shortDate(u.joinedAt)}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                          {verifiedBadge(u.verified)}
                          <span>Trust {u.trustScore}</span>
                          <span>{u.listingCount} {u.listingCount === 1 ? "listing" : "listings"}</span>
                          <span className={u.openReports ? "font-medium" : "text-foggy"}>{u.openReports} open {u.openReports === 1 ? "report" : "reports"}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {u.suspended ? (<Button onClick={() => act.mutate({ user: u, suspend: false })} disabled={act.isPending}>Restore</Button>) : (<Button variant="outline" onClick={() => setTarget(u)} disabled={act.isPending}>Suspend</Button>)}
                      </div>
                    </li>))}
                </ul>)}
            </TabsContent>
            <TabsContent value="students" className="mt-6">
              {students.length === 0 ? (<StateCard title="No one matches those filters."/>) : (<ul className="space-y-3">
                  {students.map((u) => (<li key={u.id} className="rounded-xl bg-card p-4">
                      <p className="text-base font-medium">{u.name}</p>
                      <p className="text-foggy">{u.phone}</p>
                      <p className="mt-1">{verifiedBadge(u.verified)}</p>
                    </li>))}
                </ul>)}
            </TabsContent>
          </Tabs>)}
      </div>

      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent className="rounded-xl border-0 shadow-modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {target?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Their {target?.listingCount ?? 0} listings leave the public site and they can't log in. You can restore them at any time.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => target && act.mutate({ user: target, suspend: true })}>Suspend</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
