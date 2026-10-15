import { usePageMeta } from "@/lib/usePageMeta";
import { Link } from "@/lib/router";
import { BadgeCheck, Clock, Flag, GraduationCap, ShieldCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TRUST_MAX } from "@/lib/trust";
import { STALE_DAYS } from "@/lib/format";
const desc = "What the Verified badge means, how listings stay fresh and how to stay safe on Rommie.";
const PAGE_META = [
            { title: "How Verification Works · Rommie" },
            { name: "description", content: desc },
            { property: "og:title", content: "How Verification Works · Rommie" },
            { property: "og:description", content: desc },
        ];
const faqs = [
    { q: "Which documents do you accept?", a: "Students can upload a student ID or an admission letter. Caretakers and landlords can upload a national ID or passport. Photos (JPG, PNG) and PDFs up to 8 MB work." },
    { q: "Who sees my document?", a: "Only Rommie's review team. It is never shown on your profile or in listings." },
    { q: "What if my request is rejected?", a: "You'll see the reason on your verification page and can upload a new document straight away." },
    { q: "Does Verified mean the room is perfect?", a: "No. It means we checked the caretaker's ID. It is not an inspection of the room, so always view it in person before you pay anything." },
];
export default function HowItWorks() {
    usePageMeta(PAGE_META);
    return (<div className="page-container max-w-[900px] py-8 md:py-12">
      <h1 className="text-page">How verification works</h1>
      <p className="mt-2 max-w-2xl text-base text-foggy">Rommie is built so you can trust what you see: who is renting, whether the room is really vacant, and what to do if something looks wrong.</p>

      <section className="mt-10">
        <h2 className="text-section mb-4">What gets verified</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-card p-5">
            <BadgeCheck className="h-6 w-6" strokeWidth={1.5} aria-hidden/>
            <h3 className="mt-3 text-base font-medium">Verified Caretaker or Landlord</h3>
            <p className="mt-1 text-foggy">The caretaker uploads a national ID or passport and our team reviews it. A Verified pill then shows on all their rooms and a profile badge.</p>
          </div>
          <div className="rounded-xl bg-card p-5">
            <GraduationCap className="h-6 w-6" strokeWidth={1.5} aria-hidden/>
            <h3 className="mt-3 text-base font-medium">Verified Student</h3>
            <p className="mt-1 text-foggy">Students upload a student ID or admission letter. The badge shows caretakers you're a real student. It's optional.</p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-section mb-4">Fresh vacancies</h2>
        <div className="flex gap-4 rounded-xl bg-card p-5">
          <Clock className="h-6 w-6 shrink-0" strokeWidth={1.5} aria-hidden/>
          <div className="space-y-2">
            <p>Every room shows when the caretaker last confirmed it. If nobody confirms a vacant room for <span className="font-semibold">{STALE_DAYS} days</span>, it is labelled <span className="rounded-full border border-hof px-2.5 py-0.5 text-xs font-semibold">Needs reconfirming</span> and students are told to ask first.</p>
            <p className="text-foggy">Caretakers reconfirm with one tap. Rooms marked Taken stay visible but are labelled and listed after vacant ones.</p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-section mb-4">Trust score</h2>
        <p className="mb-4 text-foggy">Each caretaker has a score from 0 to 100, made up of four parts:</p>
        <ul className="divide-y divide-bebe rounded-xl bg-card">
          {[
            ["Verification", TRUST_MAX.verification, "Has our team checked their ID?"],
            ["Listing freshness", TRUST_MAX.freshness, "Are their vacant rooms confirmed recently?"],
            ["Reports", TRUST_MAX.reports, "Fewer reports on their listings means more points."],
            ["Account age", TRUST_MAX.age, "How long they've been on Rommie."],
        ].map(([label, max, note]) => (<li key={label} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-foggy">{note}</p>
              </div>
              <span className="shrink-0 font-semibold">up to {max}</span>
            </li>))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-section mb-4">Stay safe</h2>
        <div className="flex gap-4 rounded-xl bg-faint p-5">
          <ShieldCheck className="h-6 w-6 shrink-0" strokeWidth={1.5} aria-hidden/>
          <ul className="list-disc space-y-1.5 pl-4">
            <li><span className="font-semibold">Never pay before viewing the room.</span> Rommie never asks for money to show you a listing.</li>
            <li>Visit with a friend and confirm the caretaker's identity.</li>
            <li>Ask whether the room is still vacant before you travel, especially if it says Needs reconfirming.</li>
          </ul>
        </div>
        <p className="mt-4 flex items-start gap-2 text-foggy">
          <Flag className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden/>
          Something wrong? Tap Report on any room: fake listing, already taken, wrong price or wrong photos. Our team reviews every report.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-section mb-2">Questions</h2>
        <Accordion type="single" collapsible className="rounded-xl bg-card px-5">
          {faqs.map((f, i) => (<AccordionItem key={f.q} value={`q${i}`} className="border-bebe last:border-b-0">
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-foggy">{f.a}</AccordionContent>
            </AccordionItem>))}
        </Accordion>
        <p className="mt-6 text-foggy">Ready? <Link to="/verify-student" className="font-medium text-hof underline">Verify as a student</Link> or <Link to="/caretaker/profile" className="font-medium text-hof underline">get verified as a caretaker</Link>.</p>
      </section>
    </div>);
}
