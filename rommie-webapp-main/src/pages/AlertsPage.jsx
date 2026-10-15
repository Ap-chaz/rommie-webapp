import { usePageMeta } from "@/lib/usePageMeta";
import { useState } from "react";
import { Link, useSearch } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field, SelectInput, TextInput } from "@/components/forms/Field";
import { ErrorCard, StateCard } from "@/components/StateCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RequireRole, useAuth } from "@/lib/auth";
import { alertSummary, AREAS, roomTypeLabel, shortDate } from "@/lib/format";
import { createAlert, deleteAlert, getAlerts, updateAlert } from "@/services/api";
/** Lets "No rooms match yet" on /rooms hand its filters over to this form. */
function validateSearch(s) {
    const out = {};
    if (typeof s["area"] === "string" && AREAS.includes(s["area"]))
        out.area = s["area"];
    if (typeof s["roomType"] === "string" && s["roomType"] in roomTypeLabel)
        out.roomType = s["roomType"];
    const rent = Number(s["maxRent"]);
    if (Number.isInteger(rent) && rent > 0)
        out.maxRent = rent;
    return out;
}
const PAGE_META = [{ title: "My Alerts · Rommie" }, { name: "robots", content: "noindex" }];

export default function AlertsPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["student"]}>
      <Alerts />
    </RequireRole>);
}
const parseRent = (raw) => {
    const t = raw.replace(/[,\s]/g, "").replace(/^kes/i, "");
    if (t === "")
        return null;
    const n = Number(t);
    return Number.isInteger(n) && n > 0 ? n : "invalid";
};
function Alerts() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const search = useSearch(validateSearch);
    const key = ["alerts", user?.id];
    const q = useQuery({ queryKey: key, queryFn: getAlerts, enabled: !!user });
    const [area, setArea] = useState(search.area ?? "");
    const [rent, setRent] = useState(search.maxRent ? String(search.maxRent) : "");
    const [type, setType] = useState(search.roomType ?? "");
    const [errors, setErrors] = useState({});
    const parsed = parseRent(rent);
    const draft = {
        area: (area || undefined),
        roomType: (type || undefined),
        maxRentKes: typeof parsed === "number" ? parsed : undefined,
    };
    const create = useMutation({
        mutationFn: () => createAlert(draft),
        onSuccess: async () => {
            toast.success("Alert created. We'll text you when a match opens.");
            setArea("");
            setRent("");
            setType("");
            setErrors({});
            await qc.invalidateQueries({ queryKey: key });
        },
        onError: () => toast.error("Couldn't create the alert. Check your connection and try again."),
    });
    const patch = (id, p) => qc.setQueryData(key, (cur) => cur?.map((a) => (a.id === id ? { ...a, ...p } : a)));
    const toggle = useMutation({
        mutationFn: ({ id, active }) => updateAlert(id, { active }),
        onMutate: ({ id, active }) => patch(id, { active }),
        onError: (_e, { id, active }) => {
            patch(id, { active: !active });
            toast.error("Couldn't update the alert. Try again.");
        },
        onSettled: () => qc.invalidateQueries({ queryKey: key }),
    });
    const remove = useMutation({
        mutationFn: (a) => deleteAlert(a.id),
        onSuccess: async () => {
            toast("Alert deleted");
            await qc.invalidateQueries({ queryKey: key });
        },
        onError: () => toast.error("Couldn't delete the alert. Try again."),
    });
    const submit = (e) => {
        e.preventDefault();
        if (parsed === "invalid")
            return setErrors({ rent: "Enter a whole number, like 6000." });
        if (!draft.area && !draft.roomType && !draft.maxRentKes) {
            return setErrors({ form: "Pick at least one thing to watch: an area, a rent limit or a room type." });
        }
        setErrors({});
        create.mutate();
    };
    const hasCriteria = !!(draft.area || draft.roomType || draft.maxRentKes);
    return (<div className="page-container max-w-[760px] py-6 md:py-10">
      <h1 className="text-page">My alerts</h1>
      <p className="mt-1 flex items-start gap-2 text-foggy">
        <BellRing className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden/>
        Alerts arrive by SMS{user?.phone ? ` to ${user.phone}` : ""} when a matching room is marked vacant.
      </p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4 rounded-xl bg-card p-5 md:p-6">
        <h2 className="text-section">New alert</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Area" optional>
            {(p) => (<SelectInput {...p} value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Any area</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </SelectInput>)}
          </Field>
          <Field label="Max rent (KES)" optional error={errors.rent}>
            {(p) => <TextInput {...p} inputMode="numeric" placeholder="6000" value={rent} onChange={(e) => setRent(e.target.value)}/>}
          </Field>
          <Field label="Room type" optional>
            {(p) => (<SelectInput {...p} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Any type</option>
                {Object.keys(roomTypeLabel).map((t) => <option key={t} value={t}>{roomTypeLabel[t]}</option>)}
              </SelectInput>)}
          </Field>
        </div>

        {hasCriteria && parsed !== "invalid" && (<p className="rounded-[8px] bg-faint p-3"><span className="text-foggy">You'll get a text for: </span><span className="font-medium">{alertSummary(draft)}</span></p>)}
        {errors.form && <p role="alert" className="text-sm font-medium">{errors.form}</p>}

        <Button type="submit" size="lg" disabled={create.isPending}>
          {create.isPending && <Loader2 className="animate-spin"/>} Create alert
        </Button>
      </form>

      <h2 className="text-section mb-4 mt-10">Your alerts</h2>
      {q.isError ? (<ErrorCard title="We couldn't load your alerts" onRetry={() => void q.refetch()}/>) : q.isLoading || !q.data ? (<div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-deco"/>)}</div>) : q.data.length === 0 ? (<StateCard title="No alerts yet." text="Get notified when a matching room opens."/>) : (<ul className="space-y-3">
          {q.data.map((a) => (<li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className={a.active ? "text-base font-medium" : "text-base font-medium text-foggy"}>{alertSummary(a)}</p>
                <p className="text-foggy">
                  {a.active ? "Active" : "Paused"} · created {shortDate(a.createdAt)} ·{" "}
                  <Link to="/rooms" search={{ ...(a.area ? { area: a.area } : {}), ...(a.roomType ? { roomType: a.roomType } : {}), ...(a.maxRentKes ? { maxRent: a.maxRentKes } : {}) }} className="underline hover:text-hof">
                    View rooms
                  </Link>
                </p>
              </div>
              <label className="flex min-h-11 cursor-pointer items-center gap-2">
                <Switch checked={a.active} onCheckedChange={(active) => toggle.mutate({ id: a.id, active })} aria-label={`${a.active ? "Pause" : "Resume"} alert: ${alertSummary(a)}`}/>
                <span className="text-sm font-medium">{a.active ? "On" : "Paused"}</span>
              </label>
              <Button variant="circle" size="icon" className="h-11 w-11" aria-label={`Delete alert: ${alertSummary(a)}`} onClick={() => remove.mutate(a)} disabled={remove.isPending}>
                <Trash2 />
              </Button>
            </li>))}
        </ul>)}
    </div>);
}
