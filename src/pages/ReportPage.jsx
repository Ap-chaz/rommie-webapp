import { usePageMeta } from "@/lib/usePageMeta";
import { Link } from "@/lib/router";
import { Flag, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/lib/settings";
const desc = "Found a fake, taken or wrongly priced room? Here is how to report a listing to the Rommie team.";
const PAGE_META = [
            { title: "Report a listing · Rommie" },
            { name: "description", content: desc },
            { property: "og:title", content: "Report a listing · Rommie" },
            { property: "og:description", content: desc },
        ];
const STEPS = [
    { t: "Open the room", d: "Find the listing you want to report from Find a room or your saved rooms." },
    { t: "Tap Report", d: "It is next to Save, just under the room title." },
    { t: "Pick a reason", d: "Fake listing, already taken, wrong price, wrong photos, or something else." },
    { t: "Send", d: "Our team reviews it and can hide the listing while we check." },
];
export default function ReportPage() {
    usePageMeta(PAGE_META);
    const contact = useSiteSettings();
    return (<article className="page-container max-w-[760px] py-8 md:py-12">
      <h1 className="text-page">Report a listing</h1>
      <p className="mt-3 text-base text-foggy">
        Help us keep Rommie honest. If a room looks fake, is already taken, or the price or photos don't match, tell us and we'll look into it.
      </p>

      <section className="mt-8">
        <h2 className="text-section mb-4">How to report</h2>
        <ol className="divide-y divide-bebe rounded-xl bg-card">
          {STEPS.map((s, i) => (<li key={s.t} className="flex gap-4 p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hof text-sm font-semibold text-primary-foreground">{i + 1}</span>
              <div>
                <p className="font-medium">{s.t}</p>
                <p className="text-foggy">{s.d}</p>
              </div>
            </li>))}
        </ol>
        <Button asChild size="lg" className="mt-5 w-full sm:w-auto"><Link to="/rooms"><Flag /> Find the listing</Link></Button>
      </section>

      <section className="mt-10">
        <h2 className="text-section mb-2">Can't find the listing?</h2>
        <p className="text-foggy">Message us with the room title, area and what's wrong. A link or screenshot helps.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {contact.whatsappLink && (<Button asChild variant="outline" size="lg"><a href={contact.whatsappLink} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp us</a></Button>)}
          <Button asChild variant="outline" size="lg"><a href={`mailto:${contact.email}?subject=${encodeURIComponent("Report a listing")}`}><Mail /> Email us</a></Button>
        </div>
      </section>

      <div className="mt-10 flex gap-3 rounded-xl bg-card p-5">
        <ShieldCheck className="h-6 w-6 shrink-0" strokeWidth={1.5} aria-hidden/>
        <p>Never pay before viewing a room. Rommie never asks for money to show you a listing. If someone asks you to pay first, report it.</p>
      </div>
    </article>);
}
