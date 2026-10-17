import { usePageMeta } from "@/lib/usePageMeta";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { RequireRole } from "@/lib/auth";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";
import { updateSiteSettings } from "@/services/api";
const PAGE_META = [{ title: "Settings · Rommie" }, { name: "robots", content: "noindex" }];
const FIELDS = [
    { name: "whatsapp", label: "WhatsApp number", hint: "Leave empty to hide the WhatsApp link.", type: "tel" },
    { name: "phone", label: "Phone number", hint: "Leave empty to hide the Call link.", type: "tel" },
    { name: "email", label: "Support email", type: "email" },
    { name: "hours", label: "Support hours", hint: "For example: Mon to Fri", type: "text" },
    { name: "location", label: "Based in", hint: "For example: Karen, Nairobi County, Kenya", type: "text" },
];

export default function AdminSettingsPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["admin"]}>
      <Settings />
    </RequireRole>);
}
function Settings() {
    const qc = useQueryClient();
    const [form, setForm] = useState(() => ({ ...getSettings() }));
    const [errors, setErrors] = useState({});
    const save = useMutation({
        mutationFn: () => updateSiteSettings(form),
        onSuccess: async (saved) => {
            setErrors({});
            setForm({ ...saved });
            toast.success("Settings saved", { description: "The footer and help pages now show these details." });
            await qc.invalidateQueries({ queryKey: ["admin-activity"] });
        },
        onError: (e) => {
            if (e?.errors)
                setErrors(e.errors);
            else
                toast.error(e instanceof Error ? e.message : "Couldn't save. Try again.");
        },
    });
    const set = (name, value) => { setForm((f) => ({ ...f, [name]: value })); setErrors((x) => ({ ...x, [name]: undefined })); };
    return (<div className="page-container max-w-[640px] py-6 md:py-10">
      <AdminNav />
      <h1 className="text-page">Settings</h1>
      <p className="mt-1 text-foggy">Contact details shown in the footer and on the help pages. Changes show straight away.</p>
      <form noValidate onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="mt-6 space-y-5 rounded-xl bg-card p-5">
        {FIELDS.map((f) => (<div key={f.name} className="space-y-1.5">
            <label htmlFor={`s-${f.name}`} className="block text-sm font-medium">{f.label}</label>
            <input id={`s-${f.name}`} type={f.type} value={form[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} aria-invalid={!!errors[f.name]} aria-describedby={`s-${f.name}-m`} className="min-h-11 w-full rounded-lg border border-bebe bg-card px-3 aria-[invalid=true]:border-hof"/>
            <p id={`s-${f.name}-m`} className={errors[f.name] ? "flex items-start gap-1.5 text-sm font-medium" : "text-sm text-foggy"} role={errors[f.name] ? "alert" : undefined}>
              {errors[f.name] ? (<><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden/> {errors[f.name]}</>) : f.hint}
            </p>
          </div>))}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin"/>} Save changes</Button>
          <Button type="button" variant="outline" onClick={() => { setForm({ ...DEFAULT_SETTINGS }); setErrors({}); }}>Reset to defaults</Button>
        </div>
      </form>
    </div>);
}
