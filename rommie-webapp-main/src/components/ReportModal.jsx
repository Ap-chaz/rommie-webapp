import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitReport } from "@/services/api";
import { cn } from "@/lib/utils";
const REASONS = ["Fake listing", "Already taken", "Wrong price", "Wrong photos", "Other"];
export function ReportModal({ roomId, open, onOpenChange }) {
    const [reason, setReason] = useState();
    const [note, setNote] = useState("");
    const [state, setState] = useState("idle");
    const close = (o) => {
        onOpenChange(o);
        if (!o)
            setTimeout(() => { setState("idle"); setReason(undefined); setNote(""); }, 200);
    };
    const submit = async () => {
        if (!reason)
            return; 
        setState("loading");
        await submitReport(roomId, reason, note || undefined);
        setState("done");
        toast.success("Report sent");
    };
    return (<Dialog open={open} onOpenChange={close}>
      <DialogContent className="rounded-xl border-0 shadow-modal sm:max-w-md">
        <DialogHeader><DialogTitle className="text-section">Report this listing</DialogTitle></DialogHeader>
        {state === "done" ? (<div className="space-y-4">
            <p>Thanks. Our team will review this listing.</p>
            <Button className="w-full" onClick={() => close(false)}>Done</Button>
          </div>) : (<div className="space-y-4">
            <div role="radiogroup" className="divide-y divide-bebe">
              {REASONS.map((r) => (<label key={r} className="flex min-h-12 cursor-pointer items-center justify-between">
                  <span>{r}</span>
                  <input type="radio" name="reason" className="sr-only" checked={reason === r} onChange={() => setReason(r)}/>
                  <span className={cn("h-5 w-5 rounded-full border-2", reason === r ? "border-[6px] border-hof" : "border-grey-500")} aria-hidden/>
                </label>))}
            </div>
            {reason === "Other" && (<Textarea placeholder="Tell us what's wrong" value={note} onChange={(e) => setNote(e.target.value)} className="rounded-lg"/>)}
            <Button className="w-full" disabled={!reason || state === "loading"} onClick={submit}>
              {state === "loading" && <Loader2 className="animate-spin"/>} Submit report
            </Button>
          </div>)}
      </DialogContent>
    </Dialog>);
}
