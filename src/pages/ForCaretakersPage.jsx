import { usePageMeta } from "@/lib/usePageMeta";
import { Link } from "@/lib/router";
import { BadgeCheck, Camera, Clock, MessageCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import hero from "@/assets/room-2.jpg";
const desc = "List your vacant rooms for free and reach students near CUEA, KSL, JKUAT Karen, Tangaza and Co-op University.";
const PAGE_META = [
            { title: "For Caretakers · Rommie" },
            { name: "description", content: desc },
            { property: "og:title", content: "For Caretakers · Rommie" },
            { property: "og:description", content: desc },
        ];
const steps = [
    { icon: Camera, title: "Post your room", text: "Add photos, rent and distance to campus. It takes about two minutes on your phone." },
    { icon: MessageCircle, title: "Students contact you", text: "They tap WhatsApp or Call. No middleman, no waiting for approval." },
    { icon: Clock, title: "Keep it fresh", text: "Mark a room Taken when it's let, or tap \"Yes, still vacant\" when we ask. One tap each." },
];
const perks = [
    { icon: Smartphone, title: "Made for phones", text: "Post, confirm and update everything from your phone." },
    { icon: BadgeCheck, title: "Get a Verified badge", text: "Upload your ID once. Verified caretakers stand out and score higher." },
];
export default function ForCaretakers() {
    usePageMeta(PAGE_META);
    const { user } = useAuth();
    const isCaretaker = user?.role === "caretaker";
    return (<div className="page-container max-w-[1100px] py-8 md:py-12">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-page">Fill your vacant rooms with students</h1>
          <p className="mt-3 text-base text-foggy">List your rooms for free and reach students looking near CUEA, KSL, JKUAT Karen, Tangaza and Co-operative University. They contact you directly.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {isCaretaker ? (<Button asChild size="lg"><Link to="/caretaker/post">Post a room</Link></Button>) : (<>
                <Button asChild size="lg"><Link to="/caretaker/signup">List your room</Link></Button>
                <Button asChild size="lg" variant="outline"><Link to="/caretaker/login">Log in</Link></Button>
              </>)}
          </div>
        </div>
        <img src={hero} alt="A bright, tidy single room with a bed and a desk" width={816} height={816} className="aspect-[4/3] w-full rounded-xl bg-deco object-cover"/>
      </section>

      <section className="mt-14">
        <h2 className="text-section mb-4">How it works</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {steps.map((s, i) => (<li key={s.title} className="rounded-xl bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-faint font-semibold">{i + 1}</span>
                <s.icon className="h-6 w-6" strokeWidth={1.5} aria-hidden/>
              </div>
              <h3 className="mt-3 text-base font-medium">{s.title}</h3>
              <p className="mt-1 text-foggy">{s.text}</p>
            </li>))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="text-section mb-4">Why caretakers like it</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {perks.map((p) => (<div key={p.title} className="flex gap-4 rounded-xl bg-card p-5">
              <p.icon className="h-6 w-6 shrink-0" strokeWidth={1.5} aria-hidden/>
              <div>
                <h3 className="text-base font-medium">{p.title}</h3>
                <p className="mt-1 text-foggy">{p.text}</p>
              </div>
            </div>))}
        </div>
        <p className="mt-6 text-foggy">Curious how the badge and trust score work? Read <Link to="/how-verification-works" className="font-medium text-hof underline">how verification works</Link>.</p>
      </section>
    </div>);
}
