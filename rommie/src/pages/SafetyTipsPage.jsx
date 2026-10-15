import { usePageMeta } from "@/lib/usePageMeta";
import { Link } from "@/lib/router";
import { Eye, Flag, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
const desc = "Simple steps to find a room safely: view first, bring a friend, never pay early, and report anything suspicious.";
const PAGE_META = [
            { title: "Safety tips · Rommie" },
            { name: "description", content: desc },
            { property: "og:title", content: "Safety tips · Rommie" },
            { property: "og:description", content: desc },
        ];
const TIPS = [
    {
        icon: Wallet,
        title: "Never pay before viewing",
        points: [
            "Do not send a deposit, booking fee or \"viewing fee\" before you have seen the room in person.",
            "Rommie never asks for money to show you a listing. If anyone says we do, it is a scam.",
        ],
    },
    {
        icon: Users,
        title: "Visit with a friend",
        points: [
            "Tell someone where you are going and when you expect to be back.",
            "View in daylight where you can, and note the landmarks and how you get there.",
        ],
    },
    {
        icon: Eye,
        title: "Check the room and the caretaker",
        points: [
            "Make sure the room matches the photos, price and amenities on the listing.",
            "Ask to see the caretaker's ID. Look for the Verified Caretaker badge and the trust score on the listing.",
            "Ask what the deposit covers and what the rules are before you agree to anything.",
        ],
    },
    {
        icon: Wallet,
        title: "When you are ready to pay",
        points: [
            "Pay only after you have viewed the room and agreed the terms.",
            "Pay the caretaker or landlord you met, not a third person, and ask for a written or M-Pesa receipt.",
            "Be careful if you are rushed, told others are about to take the room, or asked to pay to an unknown number.",
        ],
    },
    {
        icon: Flag,
        title: "Report anything that feels off",
        points: [
            "Fake photos, a price that changes, or a room that is already taken: tell us so we can check and hide the listing.",
        ],
    },
];
export default function SafetyTips() {
    usePageMeta(PAGE_META);
    return (<article className="page-container max-w-[760px] py-8 md:py-12">
      <h1 className="text-page">Safety tips</h1>
      <p className="mt-3 text-base text-foggy">Most rooms and caretakers on Rommie are genuine. These habits keep it that way for you.</p>

      <div className="mt-8 divide-y divide-bebe">
        {TIPS.map((t) => (<section key={t.title} className="flex gap-4 py-6 first:pt-0">
            <t.icon className="mt-1 h-6 w-6 shrink-0" strokeWidth={1.5} aria-hidden/>
            <div>
              <h2 className="text-section">{t.title}</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                {t.points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          </section>))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg"><Link to="/report"><Flag /> Report a listing</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/how-verification-works">How verification works</Link></Button>
      </div>
    </article>);
}
