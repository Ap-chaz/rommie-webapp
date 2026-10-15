import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const MAX_BYTES = 8 * 1024 * 1024;
const sizeLabel = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
/** Pick an image or PDF, preview it, and hand it to `onSubmit`. Keeps the file if the upload fails so retrying is one tap. */
export function DocumentUpload({ label, help, submitLabel, onSubmit, }) {
    const inputId = useId();
    const input = useRef(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        if (!file || !file.type.startsWith("image/")) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    const pick = (list) => {
        const f = list?.[0];
        if (!f)
            return;
        if (!(f.type.startsWith("image/") || f.type === "application/pdf")) {
            setFile(null);
            setError("Upload a photo or a PDF.");
        }
        else if (f.size > MAX_BYTES) {
            setFile(null);
            setError("That file is larger than 8 MB. Try a smaller photo.");
        }
        else {
            setFile(f);
            setError(null);
        }
        if (input.current)
            input.current.value = "";
    };
    const submit = async () => {
        if (!file)
            return;
        setBusy(true);
        setError(null);
        try {
            await onSubmit(file);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Upload failed. Check your connection and try again.");
        }
        finally {
            setBusy(false);
        }
    };
    return (<div className="space-y-4">
      <div>
        <label htmlFor={inputId} className="block text-sm font-medium">{label}</label>
        <p className="mt-0.5 text-sm text-foggy">{help}</p>
      </div>

      {file ? (<div className="flex items-center gap-4 rounded-xl border border-bebe p-3">
          {preview ? (<img src={preview} alt="Preview of the document you picked" className="h-20 w-20 shrink-0 rounded-lg bg-deco object-cover"/>) : (<span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-faint"><FileText className="h-8 w-8" strokeWidth={1.5} aria-hidden/></span>)}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{file.name}</p>
            <p className="text-foggy">{sizeLabel(file.size)}</p>
          </div>
          <Button type="button" variant="circle" size="icon" aria-label="Remove file" onClick={() => setFile(null)} disabled={busy}><X /></Button>
        </div>) : (<label htmlFor={inputId} className={cn("flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-grey-500 bg-faint px-4 py-6 text-center transition-colors hover:bg-bebe")}>
          <UploadCloud className="h-7 w-7" strokeWidth={1.5} aria-hidden/>
          <span className="font-medium">Choose a photo or PDF</span>
          <span className="text-sm text-foggy">JPG, PNG or PDF, up to 8 MB</span>
        </label>)}
      <input id={inputId} ref={input} type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => pick(e.target.files)}/>

      {error && (<p role="alert" className="flex items-start gap-1.5 text-sm font-medium">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden/> {error}
        </p>)}

      <Button type="button" size="lg" className="w-full" disabled={!file || busy} onClick={submit}>
        {busy && <Loader2 className="animate-spin"/>} {busy ? "Uploading…" : error && file ? "Try again" : submitLabel}
      </Button>
    </div>);
}
