import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/forms/Field";
import { controlClass } from "@/components/forms/Field";
import { MIN_PHOTOS, PhotoUploader } from "@/components/caretaker/PhotoUploader";
import { AMENITY_OPTIONS, amenityFormLabel, AREAS, CAMPUSES, cheapestMonthly, GENDERS, normalizeKenyanPhone, roomTypeLabel } from "@/lib/format";
import { phoneField } from "@/lib/validation";
import { cn } from "@/lib/utils";
const minutes = z.string().trim().refine((v) => v === "" || /^\d{1,3}$/.test(v), "Use whole minutes, like 10.");
const wholeKes = (what, allowZero = false) => z.string().trim().min(1, `Enter ${what}.`).refine((v) => /^\d{1,3}(,?\d{3})*$|^\d+$/.test(v), "Use whole numbers only, like 8500.")
    .refine((v) => { const n = toNum(v); return allowZero ? n >= 0 : n > 0; }, "Must be more than 0.")
    .refine((v) => toNum(v) <= 500000, "That looks too high. Check the amount.");
const toNum = (v) => Number(v.replace(/,/g, ""));
const optionSchema = z.object({
    label: z.string().trim().max(40, "Keep the name under 40 characters."),
    rent: z.string().trim(),
    maxRent: z.string().trim(),
    billing: z.enum(["month", "semester"]),
});
const kes = (v) => /^\d{1,3}(,?\d{3})*$|^\d+$/.test(v) && toNum(v) > 0 && toNum(v) <= 500000;
const schema = z
    .object({
    roomType: z.string().refine((v) => v in roomTypeLabel, "Choose a room type."),
    area: z.string().refine((v) => AREAS.includes(v), "Choose an area."),
    title: z.string().trim().min(5, "Add a short title, like “Bedsitter near KSL Gate 2”.").max(80, "Keep the title under 80 characters."),
    description: z.string().trim().max(600, "Keep the description under 600 characters."),
    rent: z.string().trim(),
    depositTerms: z.string().trim().min(2, "Describe the deposit, or write “No deposit”.").max(120, "Keep this under 120 characters."),
    amenities: z.array(z.string()),
    ...Object.fromEntries(CAMPUSES.flatMap((c) => [[`${c.key}Walk`, minutes], [`${c.key}Matatu`, minutes]])),
    matatuFare: z.string().trim(),
    gender: z.string(),
    meals: z.boolean(),
    transport: z.boolean(),
    distanceKm: z.string().trim(),
    registrationFee: z.string().trim(),
    roomOptions: z.array(optionSchema),
    mapLink: z.string().trim().refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Paste a full link starting with https://"),
    whatsapp: phoneField,
    call: phoneField,
})
    .superRefine((v, ctx) => {
    const issue = (path, message) => ctx.addIssue({ code: "custom", path, message });
    if (v.roomType === "hostel") {
        if (!GENDERS.includes(v.gender) && v.gender !== "Mixed")
            issue(["gender"], "Say who the hostel is for.");
        if (v.distanceKm !== "" && !(Number(v.distanceKm) >= 0 && Number(v.distanceKm) <= 50))
            issue(["distanceKm"], "Enter the distance in km, like 1.5.");
        if (v.registrationFee !== "" && !kes(v.registrationFee))
            issue(["registrationFee"], "Use whole numbers only, like 3000.");
        if (v.roomOptions.length === 0)
            issue(["roomOptions"], "Add at least one room option with a price.");
        v.roomOptions.forEach((o, i) => {
            if (o.label === "")
                issue(["roomOptions", i, "label"], "Name this option, like “Single” or “4 sharing”.");
            if (!kes(o.rent))
                issue(["roomOptions", i, "rent"], "Enter a price in whole shillings.");
            if (o.maxRent !== "" && (!kes(o.maxRent) || toNum(o.maxRent) <= toNum(o.rent)))
                issue(["roomOptions", i, "maxRent"], "The top of the range must be more than the price.");
        });
        return;
    }
    const rent = wholeKes("the monthly rent").safeParse(v.rent);
    if (!rent.success)
        issue(["rent"], rent.error.issues[0].message);
    const fare = wholeKes("the matatu fare", true).safeParse(v.matatuFare);
    if (!fare.success)
        issue(["matatuFare"], fare.error.issues[0].message);
    if (!CAMPUSES.some((c) => v[`${c.key}Walk`] !== "" || v[`${c.key}Matatu`] !== "")) {
        ctx.addIssue({ code: "custom", path: [`${CAMPUSES[0].key}Walk`], message: "Add at least one walking or matatu time to a campus." });
    }
});
const num = (v) => (v === "" ? undefined : Number(v));
function Section({ title, children, hint }) {
    return (<section className="rounded-xl bg-card p-5 md:p-6">
      <h2 className="text-section">{title}</h2>
      {hint && <p className="mt-1 text-foggy">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>);
}
const toItems = (urls) => urls.map((url, i) => ({ id: `existing-${i}`, status: "done", progress: 100, url }));
export function RoomForm({ initial, accountPhone, submitLabel, onSubmit, }) {
    const d = initial?.distances;
    const f = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            roomType: initial?.roomType ?? "",
            area: initial?.area ?? "",
            title: initial?.title ?? "",
            description: initial?.description ?? "",
            rent: initial ? String(initial.rentKes) : "",
            depositTerms: initial?.depositTerms ?? "",
            amenities: initial?.amenities ?? [],
            ...Object.fromEntries(CAMPUSES.flatMap((c) => [
                [`${c.key}Walk`, d?.[c.id]?.walkMin?.toString() ?? ""],
                [`${c.key}Matatu`, d?.[c.id]?.matatuMin?.toString() ?? ""],
            ])),
            matatuFare: initial ? String(initial.matatuFareKes) : "",
            gender: initial?.gender ?? "",
            meals: initial?.meals === "available",
            transport: !!initial?.transport,
            distanceKm: initial?.distanceLabel?.match(/^([\d.]+) km/)?.[1] ?? "",
            registrationFee: initial?.registrationFeeKes ? String(initial.registrationFeeKes) : "",
            roomOptions: (initial?.roomOptions ?? []).map((o) => ({ label: o.label, rent: String(o.rentKes), maxRent: o.maxKes ? String(o.maxKes) : "", billing: o.billing })),
            mapLink: initial?.mapLink ?? "",
            whatsapp: initial?.whatsappNumber ?? accountPhone,
            call: initial?.callNumber ?? accountPhone,
        },
    });
    const { errors, isSubmitting } = f.formState;
    const options = useFieldArray({ control: f.control, name: "roomOptions" });
    // Photos of each room option, by option position, so students can tell a single from an executive room.
    const [optPhotos, setOptPhotos] = useState(() => (initial?.roomOptions ?? []).map((o) => toItems(o.photos ?? [])));
    const setOptItems = (i) => (upd) => setOptPhotos((all) => all.map((cur, k) => (k === i ? (typeof upd === "function" ? upd(cur) : upd) : cur)));
    const optPhotoError = (i, force = false) => {
        if (!triedSubmit && !force)
            return undefined;
        const list = optPhotos[i] ?? [];
        if (list.some((p) => p.status === "uploading"))
            return "Wait for the photos to finish uploading.";
        if (list.some((p) => p.status === "error"))
            return "Retry or remove the photos that failed.";
        if (options.fields.length > 1 && !list.some((p) => p.status === "done"))
            return "Add at least 1 photo of this room type so students can tell the rooms apart.";
        return undefined;
    };
    const isHostel = f.watch("roomType") === "hostel";
    const [photos, setPhotos] = useState(() => toItems(initial?.photos ?? []));
    const [triedSubmit, setTriedSubmit] = useState(false);
    const done = photos.filter((p) => p.status === "done");
    const photoError = !triedSubmit ? undefined
        : photos.some((p) => p.status === "uploading") ? "Wait for the photos to finish uploading."
            : photos.some((p) => p.status === "error") ? "Retry or remove the photos that failed."
                : done.length < MIN_PHOTOS ? `Add at least ${MIN_PHOTOS} photos so students can see the room.`
                    : undefined;
    const uploading = photos.some((p) => p.status === "uploading");
    const campusErr = CAMPUSES.flatMap((c) => [errors[`${c.key}Walk`], errors[`${c.key}Matatu`]]).find(Boolean)?.message;
    const bad = (m) => !!m;
    /** After a failed submit, say so and bring the first problem into view: errors can be far below the Post button. */
    const revealProblem = () => {
        toast.error("Some details are missing or need fixing. Check the fields marked with a message.");
        setTimeout(() => {
            document.querySelector("form [role=alert]")?.scrollIntoView({ block: "center", behavior: "smooth" });
        }, 60);
    };
    const valid = async (v) => {
        if (photos.some((p) => p.status !== "done") || done.length < MIN_PHOTOS)
            return revealProblem();
        if (v.roomType === "hostel" && v.roomOptions.some((_, i) => optPhotoError(i, true) !== undefined || (optPhotos[i] ?? []).some((p) => p.status !== "done")))
            return revealProblem();
        const area = v.area;
        const roomType = v.roomType;
        const distances = isHostel ? {} : Object.fromEntries(CAMPUSES.map((c) => [c.id, { walkMin: num(v[`${c.key}Walk`]), matatuMin: num(v[`${c.key}Matatu`]) }]));
        const roomOptions = isHostel ? v.roomOptions.map((o, i) => {
            const urls = (optPhotos[i] ?? []).filter((p) => p.status === "done").map((p) => p.url);
            return { label: o.label, rentKes: toNum(o.rent), ...(o.maxRent ? { maxKes: toNum(o.maxRent) } : {}), billing: o.billing, ...(urls.length ? { photos: urls } : {}) };
        }) : undefined;
        const hostelFields = isHostel ? {
            roomOptions, gender: v.gender, meals: v.meals ? "available" : "none", transport: v.transport,
            distanceLabel: v.distanceKm !== "" ? `${Number(v.distanceKm)} km to campus` : undefined,
            registrationFeeKes: v.registrationFee ? toNum(v.registrationFee) : undefined,
        } : {};
        try {
            await onSubmit({
                title: v.title, roomType, area,
                description: v.description || `${roomTypeLabel[roomType]} in ${area}.`,
                ...hostelFields,
                rentKes: isHostel ? cheapestMonthly(roomOptions) : toNum(v.rent), depositTerms: v.depositTerms,
                amenities: v.amenities,
                distances, matatuFareKes: isHostel ? 0 : toNum(v.matatuFare),
                photos: done.map((p) => p.url),
                mapLink: v.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(area + ", Nairobi")}`,
                whatsappNumber: normalizeKenyanPhone(v.whatsapp), callNumber: normalizeKenyanPhone(v.call),
            });
        }
        catch {
            toast.error("Couldn't save the room. Your details are still here. Try again.");
        }
    };
    const submit = (e) => {
        setTriedSubmit(true);
        return f.handleSubmit(valid, revealProblem)(e);
    };
    const time = (name, label) => (<label className="block">
      <span className="mb-1 block text-xs text-foggy">{label}</span>
      <TextInput inputMode="numeric" placeholder="min" aria-label={label} aria-invalid={bad(errors[name]?.message)} {...f.register(name)}/>
    </label>);
    return (<form onSubmit={submit} noValidate className="space-y-4">
      <Section title="The room">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Room type" error={errors.roomType?.message} required>
            {(p) => (<SelectInput {...p} {...f.register("roomType")}>
                <option value="">Choose a type</option>
                {Object.entries(roomTypeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </SelectInput>)}
          </Field>
          <Field label="Area" error={errors.area?.message} required>
            {(p) => (<SelectInput {...p} {...f.register("area")}>
                <option value="">Choose an area</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </SelectInput>)}
          </Field>
        </div>
        <Field label="Title" error={errors.title?.message} required>
          {(p) => <TextInput {...p} placeholder="Bedsitter near KSL Gate 2" {...f.register("title")}/>}
        </Field>
        <Field label="Description" optional error={errors.description?.message} hint="Anything a student should know: floor, kitchen, rules.">
          {(p) => <textarea {...p} rows={3} className={cn(controlClass, "h-auto py-3")} {...f.register("description")}/>}
        </Field>
      </Section>

      {isHostel && (<Section title="Hostel details" hint="Students filter hostels by these, so fill them in accurately.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Who is it for?" error={errors.gender?.message} required>
              {(p) => (<SelectInput {...p} {...f.register("gender")}>
                  <option value="">Choose one</option>
                  <option value="Ladies">Ladies only</option>
                  <option value="Gents">Gents only</option>
                  <option value="Mixed">Ladies and gents</option>
                </SelectInput>)}
            </Field>
            <Field label="Distance to campus (km)" optional error={errors.distanceKm?.message}>
              {(p) => <TextInput {...p} inputMode="decimal" placeholder="1.5" {...f.register("distanceKm")}/>}
            </Field>
            <Field label="Registration fee (KES)" optional error={errors.registrationFee?.message} hint="One-off, non-refundable.">
              {(p) => <TextInput {...p} inputMode="numeric" placeholder="3000" {...f.register("registrationFee")}/>}
            </Field>
          </div>
          <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Services">
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[8px] border border-deco px-3 hover:bg-faint">
              <input type="checkbox" className="h-5 w-5 accent-hof" {...f.register("meals")}/> Meals available
            </label>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[8px] border border-deco px-3 hover:bg-faint">
              <input type="checkbox" className="h-5 w-5 accent-hof" {...f.register("transport")}/> Transport to campus
            </label>
          </div>
        </Section>)}

      {isHostel ? (<Section title="Room options & prices" hint="One row per choice a student can book, like Single, 4 sharing or Ensuite. Quote per month or per semester, as you charge it.">
          {options.fields.map((field, i) => (<fieldset key={field.id} className="space-y-3 rounded-[8px] border border-deco p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Option name" error={errors.roomOptions?.[i]?.label?.message} required>
                  {(p) => <TextInput {...p} placeholder="Single (ensuite)" {...f.register(`roomOptions.${i}.label`)}/>}
                </Field>
                <Field label="Charged" required>
                  {(p) => (<SelectInput {...p} {...f.register(`roomOptions.${i}.billing`)}>
                      <option value="month">Per month</option>
                      <option value="semester">Per semester</option>
                    </SelectInput>)}
                </Field>
                <Field label="Price (KES)" error={errors.roomOptions?.[i]?.rent?.message} required>
                  {(p) => <TextInput {...p} inputMode="numeric" placeholder="15000" {...f.register(`roomOptions.${i}.rent`)}/>}
                </Field>
                <Field label="Up to (KES)" optional error={errors.roomOptions?.[i]?.maxRent?.message} hint="Only if the price is a range.">
                  {(p) => <TextInput {...p} inputMode="numeric" placeholder="19000" {...f.register(`roomOptions.${i}.maxRent`)}/>}
                </Field>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Photos of this room type{options.fields.length > 1 ? " *" : " (optional)"}</p>
                <PhotoUploader items={optPhotos[i] ?? []} setItems={setOptItems(i)} error={optPhotoError(i)} min={1} max={5} label={`${f.watch(`roomOptions.${i}.label`) || "Option"} photo`} hint="Show this exact room: bed, bathroom and furniture. Up to 5 photos."/>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => { options.remove(i); setOptPhotos((all) => all.filter((_, k) => k !== i)); }}><Trash2 /> Remove option</Button>
            </fieldset>))}
          {typeof errors.roomOptions?.message === "string" && <p role="alert" className="text-sm font-medium">{errors.roomOptions.message}</p>}
          {errors.roomOptions?.root?.message && <p role="alert" className="text-sm font-medium">{errors.roomOptions.root.message}</p>}
          <Button type="button" variant="outline" onClick={() => { options.append({ label: "", rent: "", maxRent: "", billing: "month" }); setOptPhotos((all) => [...all, []]); }}><Plus /> Add a room option</Button>
          <Field label="Deposit terms" error={errors.depositTerms?.message} required>
            {(p) => <TextInput {...p} placeholder="One month deposit, or “Ask the hostel”" {...f.register("depositTerms")}/>}
          </Field>
        </Section>) : (<Section title="Price">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rent per month (KES)" error={errors.rent?.message} required>
            {(p) => <TextInput {...p} inputMode="numeric" placeholder="8500" {...f.register("rent")}/>}
          </Field>
          <Field label="Deposit terms" error={errors.depositTerms?.message} required>
            {(p) => <TextInput {...p} placeholder="One month deposit" {...f.register("depositTerms")}/>}
          </Field>
        </div>
      </Section>)}

      <Section title="What's included">
        <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Amenities">
          {AMENITY_OPTIONS.map((a) => (<label key={a} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[8px] border border-deco px-3 hover:bg-faint">
              <input type="checkbox" value={a} className="h-5 w-5 accent-hof" {...f.register("amenities")}/>
              {amenityFormLabel[a]}
            </label>))}
        </div>
      </Section>

      {!isHostel && (<Section title="Getting to campus" hint="Fill in what applies. At least one time is needed.">
        {CAMPUSES.map((c) => {
            return (<fieldset key={c.id}>
              <legend className="mb-2 font-medium">{c.name}</legend>
              <div className="grid grid-cols-2 gap-3">
                {time(`${c.key}Walk`, `${c.short} walk (min)`)}
                {time(`${c.key}Matatu`, `${c.short} matatu (min)`)}
              </div>
            </fieldset>);
        })}
        {campusErr && <p role="alert" className="text-sm font-medium">{campusErr}</p>}
        <Field label="Matatu fare to campus (KES)" error={errors.matatuFare?.message} hint="Enter 0 if students can walk." required>
          {(p) => <TextInput {...p} inputMode="numeric" placeholder="50" {...f.register("matatuFare")}/>}
        </Field>
        <Field label="Map link" optional error={errors.mapLink?.message} hint="Paste a Google Maps link to the exact spot. We'll use the area if you skip it.">
          {(p) => <TextInput {...p} type="url" inputMode="url" placeholder="https://maps.google.com/…" {...f.register("mapLink")}/>}
        </Field>
      </Section>)}
      {isHostel && (<Section title="Location">
          <Field label="Map link" optional error={errors.mapLink?.message} hint="Paste a Google Maps link to the exact spot.">
            {(p) => <TextInput {...p} type="url" inputMode="url" placeholder="https://maps.google.com/…" {...f.register("mapLink")}/>}
          </Field>
        </Section>)}

      <Section title="Photos" hint={`Add at least ${MIN_PHOTOS} bright, clear photos of the room, the bathroom and the compound.`}>
        <PhotoUploader items={photos} setItems={setPhotos} error={photoError}/>
      </Section>

      <Section title="Contact" hint="Students reach you here. Defaults to your account number.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp number" error={errors.whatsapp?.message} required>
            {(p) => <TextInput {...p} type="tel" inputMode="tel" {...f.register("whatsapp")}/>}
          </Field>
          <Field label="Call number" error={errors.call?.message} required>
            {(p) => <TextInput {...p} type="tel" inputMode="tel" {...f.register("call")}/>}
          </Field>
        </div>
      </Section>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || uploading}>
        {(isSubmitting || uploading) && <Loader2 className="animate-spin"/>}
        {uploading ? "Uploading photos…" : isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>);
}
