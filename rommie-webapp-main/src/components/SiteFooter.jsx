import { Link } from "@/lib/router";
import { ArrowUp, Clock, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Logo } from "./Logo";
import { SocialIcons } from "./SocialIcons";
import { AREAS } from "@/lib/format";
import { CONTACT, SOCIALS, SUPPORT_EMAIL } from "@/lib/site";
import { useAuth, useLogout } from "@/lib/auth";
const linkClass = "inline-flex min-h-8 items-center text-sm text-foggy hover:text-hof hover:underline";
/** Footer columns for the current visitor: no "Log in" or "Sign up" once someone is signed in. */
function colsFor(me) {
    const students = !me
        ? [
            { to: "/signup", l: "Create an account" },
            { to: "/login", l: "Log in" },
            { to: "/saved", l: "Saved rooms" },
            { to: "/alerts", l: "Vacancy alerts" },
            { to: "/verify-student", l: "Verify your student ID" },
        ]
        : me.role === "admin"
            ? [{ to: "/admin", l: "Dashboard" }, { to: "/admin/verification", l: "Verification queue" }, { l: "Log out", logout: true }]
            : me.role === "caretaker"
                ? [{ to: "/rooms", l: "Find a room" }, { l: "Log out", logout: true }]
                : [
                    { to: "/saved", l: "Saved rooms" },
                    { to: "/alerts", l: "Vacancy alerts" },
                    { to: "/verify-student", l: "Verify your student ID" },
                    { l: "Log out", logout: true },
                ];
    const caretakers = !me
        ? [
            { to: "/for-caretakers", l: "List your room" },
            { to: "/caretaker/signup", l: "Caretaker sign up" },
            { to: "/caretaker/login", l: "Caretaker log in" },
            { to: "/caretaker/profile", l: "Get verified" },
        ]
        : me.role === "caretaker"
            ? [
                { to: "/caretaker/post", l: "Post a room" },
                { to: "/caretaker/listings", l: "My listings" },
                { to: "/caretaker/profile", l: "Get verified" },
            ]
            : [{ to: "/for-caretakers", l: "List your room" }];
    return [
        {
            title: "Rommie",
            links: [
                { to: "/rooms", l: "Find a room" },
                { to: "/zones", l: "Campus zones" },
                { to: "/how-verification-works", l: "How it works" },
                { to: "/safety-tips", l: "Safety tips" },
            ],
        },
        { title: me?.role === "student" || !me ? "For students" : "Your account", links: students },
        { title: "For caretakers", links: caretakers },
        {
            title: "Support",
            links: [
                { to: "/report", l: "Report a listing" },
                { to: "/privacy", l: "Privacy policy" },
                { to: "/terms", l: "Terms of use" },
            ],
        },
    ];
}
export function SiteFooter() {
    const { user, ready } = useAuth();
    const logout = useLogout();
    // Signed-out view until hydration finishes, so server and client markup match.
    const cols = colsFor(ready ? user : null);
    return (<footer className="mt-12 border-t border-bebe bg-faint pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Safety strip */}
      <div className="border-b border-bebe bg-card">
        <div className="page-container flex items-start gap-3 py-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden/>
          <p>
            <span className="font-semibold">Stay safe:</span> never pay before viewing the room, and visit with a friend. Rommie never asks for money to show you a listing.
          </p>
        </div>
      </div>

      <div className="page-container grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1.5fr]">
        {/* Brand */}
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-foggy">
            Vacant, verified student rooms near CUEA, Kenya School of Law, JKUAT Karen Campus, Tangaza University and Co-operative University. Contact the caretaker directly on WhatsApp or by call.
          </p>
          <h3 className="mb-3 mt-6 text-sm font-semibold">Follow us</h3>
          <SocialIcons />
        </div>

        {cols.map((c) => (<nav key={c.title} aria-label={c.title}>
            <h3 className="mb-3 text-sm font-semibold">{c.title}</h3>
            <ul className="space-y-1">
              {c.links.map((x) => (<li key={x.l}>
                  {"logout" in x ? (<button type="button" onClick={logout} className={linkClass}>{x.l}</button>) : (<Link to={x.to} className={linkClass}>{x.l}</Link>)}
                </li>))}
            </ul>
          </nav>))}

        {/* Contact */}
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <h3 className="mb-3 text-sm font-semibold">Contact us</h3>
          <ul className="space-y-3 text-sm text-foggy">
            {SOCIALS.whatsapp && (<li>
                <a href={SOCIALS.whatsapp} target="_blank" rel="noopener noreferrer" className="flex min-h-8 items-start gap-2.5 hover:text-hof">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden/>
                  <span><span className="block font-medium text-hof">WhatsApp</span>{CONTACT.whatsappDisplay}</span>
                </a>
              </li>)}
            {CONTACT.phone && (<li>
                <a href={`tel:${CONTACT.phone}`} className="flex min-h-8 items-start gap-2.5 hover:text-hof">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden/>
                  <span><span className="block font-medium text-hof">Call</span>{CONTACT.phoneDisplay}</span>
                </a>
              </li>)}
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="flex min-h-8 items-start gap-2.5 hover:text-hof">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden/>
                <span className="min-w-0"><span className="block font-medium text-hof">Email</span><span className="break-all">{SUPPORT_EMAIL}</span></span>
              </a>
            </li>
            {CONTACT.hours && (<li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden/>
                <span><span className="block font-medium text-hof">Support hours</span>{CONTACT.hours}</span>
              </li>)}
            {CONTACT.location && (<li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden/>
                <span><span className="block font-medium text-hof">Based in</span>{CONTACT.location}</span>
              </li>)}
          </ul>
        </div>
      </div>

      {/* Popular areas */}
      <div className="page-container border-t border-bebe py-6">
        <h3 className="mb-3 text-sm font-semibold">Rooms by area</h3>
        <ul className="flex flex-wrap gap-2">
          {AREAS.map((a) => (<li key={a}>
              <Link to="/rooms" search={{ area: a }} className="inline-flex min-h-9 items-center rounded-full border border-deco bg-card px-4 text-sm hover:border-hof">
                {a}
              </Link>
            </li>))}
          {["KSL", "CUEA", "Co-op"].map((c) => (<li key={c}>
              <Link to="/rooms" search={{ near: c }} className="inline-flex min-h-9 items-center rounded-full border border-deco bg-card px-4 text-sm hover:border-hof">
                Near {c}
              </Link>
            </li>))}
        </ul>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-bebe">
        <div className="page-container flex flex-col gap-3 py-6 text-sm text-foggy md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Rommie. Made for students</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/privacy" className="hover:text-hof hover:underline">Privacy</Link>
            <Link to="/terms" className="hover:text-hof hover:underline">Terms</Link>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex min-h-9 items-center gap-1.5 font-medium text-hof hover:underline">
              <ArrowUp className="h-4 w-4" aria-hidden/> Back to top
            </button>
          </div>
        </div>
      </div>
    </footer>);
}
