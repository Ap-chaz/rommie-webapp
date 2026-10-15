import { usePageMeta } from "@/lib/usePageMeta";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ExternalLink, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ErrorCard, StateCard } from "@/components/StateCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RequireRole } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { getVerificationQueue, reviewVerification } from "@/services/api";
const PAGE_META = [{ title: "Verification Queue · Rommie" }, { name: "robots", content: "noindex" }];

export default function AdminVerificationPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["admin"]}>
      <Queue />
    </RequireRole>);
}
const tabClass = "shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-1 text-base text-foggy data-[state=active]:border-hof data-[state=active]:bg-transparent data-[state=active]:text-hof data-[state=active]:shadow-none";
function Queue() {
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ["verification-queue"], queryFn: getVerificationQueue });
    const [viewing, setViewing] = useState(null);
    const [rejecting, setRejecting] = useState(null);
    const review = useMutation({
        mutationFn: (v) => reviewVerification(v.req.id, v.decision, v.reason),
        onSuccess: async (_d, { req, decision }) => {
            toast.success(decision === "approved" ? `Approved ${req.name}` : `Rejected ${req.name}`);
            setRejecting(null);
            await Promise.all(["verification-queue", "rooms", "room", "caretaker-profile", "my-verification"].map((k) => qc.invalidateQueries({ queryKey: [k] })));
        },
        onError: () => toast.error("Couldn't save the decision. Try again."),
    });
    const students = q.data?.filter((r) => r.kind === "student") ?? [];
    const caretakers = q.data?.filter((r) => r.kind === "caretaker") ?? [];
    const list = (items) => items.length === 0 ? (<StateCard title="Nothing waiting for review."/>) : (<ul className="space-y-3">
        {items.map((r) => (<li key={r.id} className="flex flex-col gap-4 rounded-xl bg-card p-4 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium">{r.name}</p>
              <p className="text-foggy">{r.phone} · submitted {shortDate(r.submittedAt)}</p>
              <button onClick={() => setViewing(r)} className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-medium underline md:min-h-0">
                <FileText className="h-4 w-4" aria-hidden/> View {r.documentName ?? "document"}
              </button>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => review.mutate({ req: r, decision: "approved" })} disabled={review.isPending}>Approve</Button>
              <Button variant="outline" onClick={() => setRejecting(r)} disabled={review.isPending}>Reject</Button>
            </div>
          </li>))}
      </ul>);
    return (<div className="page-container max-w-[900px] py-6 md:py-10">
      <h1 className="text-page">Verification queue</h1>
      <p className="mt-1 text-foggy">Oldest first. Approving a caretaker adds the Verified badge to all their rooms.</p>

      <div className="mt-6">
        {q.isError ? (<ErrorCard title="We couldn't load the queue" onRetry={() => void q.refetch()}/>) : !q.data ? (<div className="space-y-3" aria-busy="true" aria-label="Loading">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-deco"/>)}</div>) : (<Tabs defaultValue="students">
            <TabsList className="no-scrollbar h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-bebe bg-transparent p-0">
              <TabsTrigger value="students" className={tabClass}>Students ({students.length})</TabsTrigger>
              <TabsTrigger value="caretakers" className={tabClass}>Caretakers & landlords ({caretakers.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="students" className="mt-6">{list(students)}</TabsContent>
            <TabsContent value="caretakers" className="mt-6">{list(caretakers)}</TabsContent>
          </Tabs>)}
      </div>

      <DocumentViewer req={viewing} onClose={() => setViewing(null)}/>
      <RejectDialog req={rejecting} busy={review.isPending} onClose={() => setRejecting(null)} onConfirm={(reason) => rejecting && review.mutate({ req: rejecting, decision: "rejected", reason })}/>
    </div>);
}
function DocumentViewer({ req, onClose }) {
    const [failed, setFailed] = useState(false);
    const pdf = req?.documentMime === "application/pdf";
    return (<Dialog open={!!req} onOpenChange={(o) => { if (!o) {
        onClose();
        setFailed(false);
    } }}>
      <DialogContent className="max-h-[95dvh] overflow-y-auto rounded-xl border-0 shadow-modal sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-section">{req?.name}</DialogTitle>
          <DialogDescription>{req?.kind === "student" ? "Student ID or admission letter" : "Caretaker ID"} · {req?.documentName}</DialogDescription>
        </DialogHeader>
        {req && (failed ? (<p className="rounded-[8px] bg-faint p-4">This file can't be previewed any more. Ask them to resubmit, or reject with that reason.</p>) : pdf ? (<iframe title={`Document from ${req.name}`} src={req.documentUrl} className="h-[65dvh] w-full rounded-lg border border-bebe"/>) : (<img src={req.documentUrl} alt={`Document uploaded by ${req.name}`} onError={() => setFailed(true)} className="max-h-[65dvh] w-full rounded-lg bg-faint object-contain"/>))}
        {req && !failed && (<a href={req.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium underline"><ExternalLink className="h-4 w-4" aria-hidden/> Open in a new tab</a>)}
      </DialogContent>
    </Dialog>);
}
function RejectDialog({ req, busy, onClose, onConfirm }) {
    const [reason, setReason] = useState("");
    const [touched, setTouched] = useState(false);
    useEffect(() => { setReason(""); setTouched(false); }, [req?.id]);
    const missing = touched && reason.trim() === "";
    const close = () => { setReason(""); setTouched(false); onClose(); };
    return (<Dialog open={!!req} onOpenChange={(o) => !o && close()}>
      <DialogContent className="rounded-xl border-0 shadow-modal sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-section">Reject {req?.name}?</DialogTitle>
          <DialogDescription>They'll see your reason and can send a new document.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <label htmlFor="reject-reason" className="block text-sm font-medium">Reason <span aria-hidden>*</span></label>
          <Textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={missing} placeholder="For example: the photo is blurry, please upload a clearer one." className="rounded-lg"/>
          {missing && (<p role="alert" className="flex items-start gap-1.5 text-sm font-medium"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden/> Add a reason so they know what to fix.</p>)}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={() => { setTouched(true); if (reason.trim())
        onConfirm(reason.trim()); }} disabled={busy}>
            {busy && <Loader2 className="animate-spin"/>} Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
