import { BadgeCheck, Check } from "lucide-react";
import { shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
const LABEL = {
    none: "Not submitted",
    pending: "Pending review",
    approved: "Verified",
    rejected: "Rejected",
};
export function StatusPill({ status }) {
    return (<span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", status === "approved" ? "border-hof bg-hof text-primary-foreground" : "border-hof")}>
      {status === "approved" && <BadgeCheck className="h-3.5 w-3.5" aria-hidden/>} {LABEL[status]}
    </span>);
}
const STEPS = ["Submitted", "In review", "Decision"];
/** Three neutral steps: filled = done, outlined = still to come. */
export function VerificationSteps({ state }) {
    const done = state.status === "none" ? 0 : state.status === "pending" ? 2 : 3;
    return (<ol className="flex items-center gap-2" aria-label="Verification progress">
      {STEPS.map((s, i) => (<li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
          <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", i < done ? "border-hof bg-hof text-primary-foreground" : "border-grey-500 text-foggy")}>
            {i < done ? <Check className="h-3.5 w-3.5" aria-hidden/> : i + 1}
          </span>
          <span className={cn("text-sm", i < done ? "font-medium" : "text-foggy")}>{i === 2 && state.status === "rejected" ? "Rejected" : i === 2 && state.status === "approved" ? "Verified" : s}</span>
          {i < STEPS.length - 1 && <span className={cn("h-px flex-1", i + 1 < done ? "bg-hof" : "bg-bebe")} aria-hidden/>}
        </li>))}
    </ol>);
}
/** Submitted date and, when rejected, the reason. */
export function StatusDetail({ state }) {
    const r = state.request;
    if (!r)
        return null;
    return (<div className="space-y-1">
      <p className="text-foggy">{r.documentName ? `${r.documentName} · ` : ""}submitted {shortDate(r.submittedAt)}</p>
      {state.status === "rejected" && r.reason && (<p><span className="font-semibold">Reason:</span> {r.reason}</p>)}
    </div>);
}
