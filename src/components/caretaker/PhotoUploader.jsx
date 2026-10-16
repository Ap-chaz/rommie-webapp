import { useRef } from "react";
import { ArrowLeft, ArrowRight, Camera, ImagePlus, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image";
import { uploadPhoto } from "@/services/api";
export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 10;
const newId = () => Math.random().toString(36).slice(2, 10);
export function PhotoUploader({ items, setItems, error, min = MIN_PHOTOS, max = MAX_PHOTOS, label = "Room photo", hint }) {
    const gallery = useRef(null);
    const camera = useRef(null);
    const patch = (id, p) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...p } : i)));
    const run = async (id, file) => {
        patch(id, { status: "uploading", progress: 0, error: undefined });
        try {
            const small = await compressImage(file);
            const url = await uploadPhoto(small, (progress) => patch(id, { progress }));
            patch(id, { status: "done", progress: 100, url, file: undefined });
        }
        catch (e) {
            patch(id, { status: "error", error: e instanceof Error ? e.message : "Upload failed.", file });
        }
    };
    const add = (files) => {
        if (!files)
            return;
        const room = max - items.length;
        const picked = Array.from(files).slice(0, Math.max(room, 0));
        const fresh = picked.map((file) => ({ id: newId(), file }));
        setItems((cur) => [...cur, ...fresh.map(({ id, file }) => ({ id, status: "uploading", progress: 0, file }))]);
        fresh.forEach(({ id, file }) => void run(id, file));
    };
    const move = (idx, dir) => setItems((cur) => {
        const next = [...cur];
        const j = idx + dir;
        if (j < 0 || j >= next.length)
            return cur;
        [next[idx], next[j]] = [next[j], next[idx]];
        return next;
    });
    const done = items.filter((i) => i.status === "done").length;
    const full = items.length >= max;
    return (<div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={full} onClick={() => camera.current?.click()}><Camera /> Take a photo</Button>
        <Button type="button" variant="outline" disabled={full} onClick={() => gallery.current?.click()}><ImagePlus /> Choose from gallery</Button>
        <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }}/>
        <input ref={gallery} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }}/>
      </div>
      <p className={`mt-2 text-sm ${error ? "font-medium text-hof" : "text-foggy"}`} role={error ? "alert" : undefined}>
        {error ?? hint ?? `${done} of ${min} minimum added. Up to ${max}. The first photo is the cover.`}
      </p>

      {items.length > 0 && (<ul className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-5">
          {items.map((it, idx) => (<li key={it.id} className="relative aspect-square overflow-hidden rounded-xl bg-deco">
              {it.url && <img src={it.url} alt={`${label} ${idx + 1}`} className="h-full w-full object-cover"/>}
              {idx === 0 && it.status === "done" && (<span className="absolute left-2 top-2 rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold shadow-search">Cover</span>)}
              {it.status === "uploading" && (<div className="absolute inset-x-0 bottom-0 bg-card/90 p-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-bebe" role="progressbar" aria-valuenow={it.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading photo ${idx + 1}`}>
                    <div className="h-full bg-hof transition-[width]" style={{ width: `${it.progress}%` }}/>
                  </div>
                </div>)}
              {it.status === "error" && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-card/95 p-2 text-center">
                  <p className="line-clamp-3 text-xs font-medium">{it.error}</p>
                  {it.file && (<button type="button" onClick={() => void run(it.id, it.file)} className="flex min-h-9 items-center gap-1 rounded-full border border-hof px-3 text-xs font-medium">
                      <RotateCw className="h-3 w-3"/> Retry
                    </button>)}
                </div>)}
              <button type="button" aria-label={`Remove photo ${idx + 1}`} onClick={() => setItems((c) => c.filter((x) => x.id !== it.id))} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-search"><X className="h-4 w-4"/></span>
              </button>
              {it.status === "done" && (<>
                  {idx > 0 && (<button type="button" aria-label={`Move photo ${idx + 1} earlier`} onClick={() => move(idx, -1)} className="absolute bottom-0 left-0 flex h-11 w-11 items-center justify-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-search"><ArrowLeft className="h-4 w-4"/></span>
                    </button>)}
                  {idx < items.length - 1 && (<button type="button" aria-label={`Move photo ${idx + 1} later`} onClick={() => move(idx, 1)} className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-search"><ArrowRight className="h-4 w-4"/></span>
                    </button>)}
                </>)}
            </li>))}
        </ul>)}
    </div>);
}
