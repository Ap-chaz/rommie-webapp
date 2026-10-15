import { usePageMeta } from "@/lib/usePageMeta";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { ErrorCard } from "@/components/StateCard";
import { DocumentUpload } from "@/components/verify/DocumentUpload";
import { StatusDetail, StatusPill, VerificationSteps } from "@/components/verify/VerificationStatus";
import { RequireRole, useAuth } from "@/lib/auth";
import { getMyVerification, submitVerification } from "@/services/api";
const PAGE_META = [{ title: "Verify Student ID · Rommie" }, { name: "robots", content: "noindex" }];

export default function VerifyStudentPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["student"]}>
      <VerifyStudent />
    </RequireRole>);
}
function VerifyStudent() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const key = ["my-verification", "student", user?.id];
    const q = useQuery({ queryKey: key, queryFn: () => getMyVerification("student"), enabled: !!user });
    const upload = async (file) => {
        await submitVerification("student", file);
        toast.success("Submitted. We'll review it soon.");
        await qc.invalidateQueries({ queryKey: key });
    };
    const state = q.data;
    const canSubmit = state?.status === "none" || state?.status === "rejected";
    return (<div className="page-container max-w-[640px] py-6 md:py-10">
      <h1 className="text-page">Verify your student status</h1>
      <p className="mt-2 text-foggy">
        Upload your student ID or admission letter to get a Verified Student badge. We only use the document to check that you're enrolled.
      </p>

      <div className="mt-6 space-y-6 rounded-xl bg-card p-5 md:p-6">
        {q.isError ? (<ErrorCard title="We couldn't load your status" onRetry={() => void q.refetch()}/>) : !state ? (<div className="space-y-3" aria-busy="true" aria-label="Loading">
            <div className="h-6 w-32 animate-pulse rounded-full bg-deco"/>
            <div className="h-24 animate-pulse rounded-xl bg-deco"/>
          </div>) : (<>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-section">Status</h2>
              <StatusPill status={state.status}/>
            </div>
            <VerificationSteps state={state}/>

            {state.status === "approved" && (<p className="flex items-start gap-2 rounded-[8px] bg-faint p-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden/>
                <span>You're a <span className="font-semibold">Verified Student</span>. The badge shows in your profile menu.</span>
              </p>)}
            {state.status === "pending" && (<p className="rounded-[8px] bg-faint p-3">A team member will review your document. This page updates when there's a decision.</p>)}
            {state.status === "rejected" && (<p className="rounded-[8px] bg-faint p-3">We couldn't verify that document. Fix the issue below and send a new one.</p>)}
            <StatusDetail state={state}/>

            {canSubmit && (<div className="border-t border-bebe pt-6">
                <DocumentUpload label={state.status === "rejected" ? "Upload a new document" : "Student ID or admission letter"} help="Make sure your name and the university are easy to read." submitLabel={state.status === "rejected" ? "Resubmit" : "Submit for review"} onSubmit={upload}/>
              </div>)}
          </>)}
      </div>
    </div>);
}
