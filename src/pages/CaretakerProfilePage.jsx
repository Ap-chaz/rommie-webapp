import { usePageMeta } from "@/lib/usePageMeta";
import { Link } from "@/lib/router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { TrustScoreCard } from "@/components/caretaker/TrustScoreCard";
import { ErrorCard, StateCard } from "@/components/StateCard";
import { DocumentUpload } from "@/components/verify/DocumentUpload";
import { StatusDetail, StatusPill, VerificationSteps } from "@/components/verify/VerificationStatus";
import { Button } from "@/components/ui/button";
import { RequireRole, useAuth } from "@/lib/auth";
import { daysAgoLabel, formatKes, roomTypeLabel } from "@/lib/format";
import { daysSince, getCaretakerProfile, submitVerification } from "@/services/api";
import { cn } from "@/lib/utils";
const PAGE_META = [{ title: "Caretaker Profile · Rommie" }, { name: "robots", content: "noindex" }];

export default function CaretakerProfilePage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["caretaker"]} loginPath="/caretaker/login">
      <Profile />
    </RequireRole>);
}
function Profile() {
    const { user } = useAuth();
    const key = ["caretaker-profile", user?.id];
    const q = useQuery({ queryKey: key, queryFn: () => getCaretakerProfile(user.id), enabled: !!user });
    return (<div className="page-container max-w-[960px] py-6 md:py-10">
      {q.isError ? (<ErrorCard title="We couldn't load your profile" onRetry={() => void q.refetch()}/>) : !q.data ? (<div className="space-y-4" aria-busy="true" aria-label="Loading">
          <div className="h-16 w-72 animate-pulse rounded-xl bg-deco"/>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-80 animate-pulse rounded-xl bg-deco"/>
            <div className="h-80 animate-pulse rounded-xl bg-deco"/>
          </div>
        </div>) : (<ProfileBody profile={q.data} queryKey={key}/>)}
    </div>);
}
function ProfileBody({ profile, queryKey }) {
    const qc = useQueryClient();
    const { caretaker, rooms, trust, verification } = profile;
    const upload = async (file) => {
        await submitVerification("caretaker", file);
        toast.success("Submitted. We'll review it soon.");
        await qc.invalidateQueries({ queryKey });
    };
    return (<>
      <header className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-hof text-2xl font-semibold text-primary-foreground" aria-hidden>
          {caretaker.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="text-page">{caretaker.name}</h1>
          <p className="flex flex-wrap items-center gap-x-1.5 text-foggy">
            {caretaker.verified ? <><BadgeCheck className="h-4 w-4 text-hof" aria-hidden/> <span className="text-hof">Verified Caretaker</span></> : "Not verified yet"}
            <span aria-hidden>·</span> {caretaker.phone}
          </p>
        </div>
      </header>

      <div className="mt-8 grid items-start gap-4 md:grid-cols-2">
        <TrustScoreCard trust={trust}/>

        <section className="rounded-xl bg-card p-5 md:p-6" aria-labelledby="verif-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 id="verif-heading" className="text-section">Verification</h2>
            <StatusPill status={caretaker.verified ? "approved" : verification.status}/>
          </div>
          <div className="mt-4 space-y-5">
            {caretaker.verified ? (<p className="flex items-start gap-2 rounded-[8px] bg-faint p-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden/>
                <span>You're a <span className="font-semibold">Verified Caretaker</span>. Students see the badge on all your rooms.</span>
              </p>) : (<>
                <p>Verified caretakers get a badge on every listing, and students contact them more often. Upload your national ID to request it.</p>
                {verification.status !== "none" && <VerificationSteps state={verification}/>}
                {verification.status === "pending" && <p className="rounded-[8px] bg-faint p-3">A team member will review your ID. This page updates when there's a decision.</p>}
                <StatusDetail state={verification}/>
                {(verification.status === "none" || verification.status === "rejected") && (<DocumentUpload label={verification.status === "rejected" ? "Upload a new ID" : "National ID or passport"} help="A clear photo of the front, or a PDF." submitLabel={verification.status === "rejected" ? "Resubmit" : "Request verification"} onSubmit={upload}/>)}
              </>)}
          </div>
        </section>
      </div>

      <section className="mt-10" aria-labelledby="rooms-heading">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="rooms-heading" className="text-section">Your rooms</h2>
          <Button asChild variant="outline"><Link to="/caretaker/listings">Manage listings</Link></Button>
        </div>
        {rooms.length === 0 ? (<StateCard title="You haven't posted a room yet" text="Add your first vacancy. It takes about two minutes.">
            <Button asChild><Link to="/caretaker/post">Post a Room</Link></Button>
          </StateCard>) : (<ul className="space-y-3">
            {rooms.map((r) => {
                const vacant = r.status === "Vacant";
                return (<li key={r.id}>
                  <Link to="/rooms/$id" params={{ id: r.id }} disabled={!!r.hidden} className="flex items-center gap-4 rounded-xl bg-card p-3 hover:bg-bebe/40">
                    <img src={r.photos[0]} alt="" width={64} height={64} loading="lazy" className={cn("h-16 w-16 shrink-0 rounded-lg bg-deco object-cover", !vacant && "opacity-70")}/>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.title}</p>
                      <p className="truncate text-foggy">{r.area} · {roomTypeLabel[r.roomType]} · {formatKes(r.rentKes)}/month</p>
                    </div>
                    <p className="hidden shrink-0 text-foggy sm:block">
                      {r.hidden ? "Hidden by Rommie" : vacant ? `Vacant · confirmed ${daysAgoLabel(daysSince(r.lastConfirmedVacantAt))}` : "Taken"}
                    </p>
                  </Link>
                </li>);
            })}
          </ul>)}
      </section>
    </>);
}
