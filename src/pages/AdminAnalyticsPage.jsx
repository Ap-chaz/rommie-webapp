import { usePageMeta } from "@/lib/usePageMeta";
import { useQuery } from "@tanstack/react-query";
import { ErrorCard } from "@/components/StateCard";
import { AdminNav } from "@/components/AdminNav";
import { Link } from "@/lib/router";
import { RequireRole } from "@/lib/auth";
import { roomTypeLabel } from "@/lib/format";
import { getAdminAnalytics } from "@/services/api";
const PAGE_META = [{ title: "Analytics · Rommie" }, { name: "robots", content: "noindex" }];
const shortDay = (key) => new Date(key + "T00:00:00Z").toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "UTC" });

export default function AdminAnalyticsPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["admin"]}>
      <Analytics />
    </RequireRole>);
}
/** A plain horizontal bar list. Each row shows its own number, so colour never carries meaning. */
function Bars({ rows, label, value, note }) {
    const max = Math.max(1, ...rows.map(value));
    return (<ul className="space-y-2">
      {rows.map((r) => (<li key={label(r)} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 sm:grid-cols-[150px_1fr_auto]">
          <span className="truncate">{label(r)}</span>
          <span className="h-3 overflow-hidden rounded-full bg-faint"><span className="block h-full rounded-full bg-hof" style={{ width: `${(value(r) / max) * 100}%` }}/></span>
          <span className="min-w-24 whitespace-nowrap text-right tabular-nums">{value(r)}{note ? <span className="text-foggy"> {note(r)}</span> : null}</span>
        </li>))}
    </ul>);
}
function Section({ title, hint, children }) {
    return (<section className="rounded-xl bg-card p-5">
      <h2 className="text-section">{title}</h2>
      {hint && <p className="mb-4 mt-1 text-foggy">{hint}</p>}
      {children}
    </section>);
}
function Analytics() {
    const q = useQuery({ queryKey: ["admin-analytics"], queryFn: getAdminAnalytics });
    const d = q.data;
    return (<div className="page-container max-w-[900px] py-6 md:py-10">
      <AdminNav />
      <h1 className="text-page">Analytics</h1>
      <p className="mt-1 text-foggy">What is on the site and how people use it. Hidden and suspended listings are left out.</p>
      <div className="mt-6 space-y-4">
        {q.isError ? (<ErrorCard title="We couldn't load analytics" onRetry={() => void q.refetch()}/>) : !d ? (<div className="space-y-4" aria-busy="true" aria-label="Loading">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-deco"/>)}</div>) : (<>
            <Section title="Listings by area" hint={`${d.vacancyRate}% of live listings are vacant.`}>
              <Bars rows={d.byArea} label={(r) => r.key} value={(r) => r.total} note={(r) => `(${r.vacant} vacant)`}/>
            </Section>
            <Section title="Listings by type">
              <Bars rows={d.byType} label={(r) => roomTypeLabel[r.key] ?? r.key} value={(r) => r.total} note={(r) => `(${r.vacant} vacant)`}/>
            </Section>
            <Section title="Contacts in the last 14 days" hint={`${d.contactsTotal} WhatsApp and call taps in total.`}>
              {d.contactsTotal === 0 ? (<p className="text-foggy">No contacts yet. They appear when someone taps WhatsApp or Call on a listing.</p>) : (<Bars rows={d.contactsByDay} label={(r) => shortDay(r.key)} value={(r) => r.count}/>)}
              {d.topListings.length > 0 && (<>
                  <h3 className="mb-2 mt-6 font-medium">Most contacted listings</h3>
                  <ol className="space-y-1">
                    {d.topListings.map((t) => (<li key={t.id} className="flex justify-between gap-3"><Link to="/rooms/$id" params={{ id: t.id }} className="truncate hover:underline">{t.title}</Link><span className="tabular-nums">{t.count}</span></li>))}
                  </ol>
                </>)}
            </Section>
            <Section title="New caretakers per week" hint="Last 8 weeks, by the date they joined.">
              <Bars rows={d.caretakerSignups} label={(r) => `Week to ${shortDay(r.key)}`} value={(r) => r.count}/>
            </Section>
          </>)}
      </div>
    </div>);
}
