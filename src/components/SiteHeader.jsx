import { useEffect, useState } from "react";
import { Link, usePathname } from "@/lib/router";
import { ADMIN_LINKS } from "@/components/AdminNav";
import { BadgeCheck, Bell, Building2, Heart, Home, LayoutDashboard, ListChecks, MapPin, PlusSquare, Search, User as UserIcon } from "lucide-react";
import { Logo } from "./Logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth, useLogout } from "@/lib/auth";
import { refreshSession } from "@/services/api";
import { cn } from "@/lib/utils";
const tabs = [
    { to: "/rooms", label: "Find a Room", icon: Home },
    { to: "/zones", label: "Campus Zones", icon: MapPin },
    { to: "/for-caretakers", label: "For Caretakers", icon: Building2 },
    { to: "/how-verification-works", label: "How It Works", icon: BadgeCheck },
];
/** Profile-menu entries by role. `null` = signed out. */
function menuFor(user) {
    if (!user)
        return [
            { label: "Log in", to: "/login", strong: true },
            { label: "Sign up", to: "/signup" },
            { label: "For Caretakers", to: "/for-caretakers" },
        ];
    if (user.role === "caretaker")
        return [
            { label: "My Listings", to: "/caretaker/listings" },
            { label: "Post a Room", to: "/caretaker/post" },
            { label: "Profile", to: "/caretaker/profile" },
        ];
    if (user.role === "admin")
        return [
            ...ADMIN_LINKS,
        ];
    return [
        { label: "Saved Rooms", to: "/saved" },
        { label: "My Alerts", to: "/alerts" },
        { label: "Verify Student ID", to: "/verify-student" },
    ];
}
function Avatar({ user }) {
    return user ? (<span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-hof text-xs font-semibold text-primary-foreground">
      {user.name.trim().charAt(0).toUpperCase()}
    </span>) : (<UserIcon className="h-5 w-5" strokeWidth={1.75}/>);
}
function mobileTabs(user) {
    const explore = { to: "/rooms", label: "Explore", icon: Search };
    const profile = { label: "Profile", icon: UserIcon };
    if (user?.role === "caretaker")
        return [explore, { to: "/caretaker/listings", label: "Listings", icon: ListChecks }, { to: "/caretaker/post", label: "Post", icon: PlusSquare }, profile];
    if (user?.role === "admin")
        return [explore, { to: "/admin", label: "Dashboard", icon: LayoutDashboard }, { to: "/admin/verification", label: "Queue", icon: BadgeCheck }, profile];
    return [explore, { to: "/saved", label: "Saved", icon: Heart }, { to: "/alerts", label: "Alerts", icon: Bell }, profile];
}
export function SiteHeader() {
    const path = usePathname();
    const { user, ready } = useAuth();
    const logout = useLogout();
    const [sheet, setSheet] = useState(false);
    // Until hydration finishes, render the signed-out view so server and client markup match.
    const me = ready ? user : null;
    // An admin may have approved this student's ID since they last logged in; pick the badge up on load.
    useEffect(() => {
        if (me?.role === "student")
            refreshSession();
    }, [me?.id, me?.role]);
    const items = menuFor(me);
    const postTo = me?.role === "caretaker" ? "/caretaker/post" : "/caretaker/signup";
    return (<>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-bebe bg-card pt-[env(safe-area-inset-top)]">
        <div className="page-container flex h-(--header-h) items-center gap-4 xl:grid xl:grid-cols-[1fr_auto_1fr]">
          <Logo />
          <nav className="hidden items-center gap-1 lg:mx-auto lg:flex" aria-label="Main">
            {tabs.map((t) => {
            const active = path.startsWith(t.to);
            return (<Link key={t.to} to={t.to} aria-current={active ? "page" : undefined} className={cn("flex h-10 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors xl:px-4", active ? "bg-bebe text-hof" : "text-foggy hover:bg-faint hover:text-hof")}>
                  {t.label}
                </Link>);
        })}
          </nav>
          <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex lg:ml-0 xl:justify-self-end">
            {!me && (<>
                <Link to="/login" className="flex h-10 items-center rounded-lg px-3 text-sm font-medium hover:bg-faint">
                  Log in
                </Link>
                <Link to="/signup" className="flex h-10 items-center rounded-lg border border-hof px-3.5 text-sm font-medium hover:bg-faint">
                  Sign up
                </Link>
              </>)}
            {me?.role !== "admin" && (<Link to={postTo} className="flex h-10 items-center rounded-lg bg-hof px-3.5 text-sm font-medium text-primary-foreground hover:bg-hof/90">
                List a room
              </Link>)}
            {me && (<DropdownMenu>
              <DropdownMenuTrigger aria-label="Open menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-faint hover:bg-bebe">
                <Avatar user={me}/>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-xl border-0 py-2 shadow-dropdown">
                {me && (<>
                    <DropdownMenuLabel className="px-4 py-2 font-normal">
                      <span className="block font-semibold">{me.name}</span>
                      {me.studentVerified && <span className="flex items-center gap-1 text-sm"><BadgeCheck className="h-4 w-4" aria-hidden/> Verified Student</span>}
                      <span className="block text-foggy capitalize">{me.role}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>)}
                {items.map((i) => (<DropdownMenuItem key={i.to} asChild className={cn("px-4 py-2.5", i.strong && "font-semibold")}>
                    <Link to={i.to}>{i.label}</Link>
                  </DropdownMenuItem>))}
                {me && (<>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="px-4 py-2.5">Log out</DropdownMenuItem>
                  </>)}
              </DropdownMenuContent>
            </DropdownMenu>)}
          </div>
        </div>
      </header>

      <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-start justify-around border-t border-bebe bg-card pt-2 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] lg:hidden">
        {mobileTabs(me).map((t) => {
            const active = t.to ? (t.to === "/admin" ? path === t.to : path.startsWith(t.to)) : sheet;
            const cls = cn("flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 text-[11px]", active ? "text-hof" : "text-foggy");
            return t.to ? (<Link key={t.label} to={t.to} className={cls}>
              <t.icon className="h-6 w-6" strokeWidth={1.5}/>
              {t.label}
            </Link>) : (<button key={t.label} onClick={() => setSheet(true)} className={cls}>
              {me ? <Avatar user={me}/> : <t.icon className="h-6 w-6" strokeWidth={1.5}/>}
              {t.label}
            </button>);
        })}
      </nav>

      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-xl border-0 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <SheetHeader className="text-left">
            <SheetTitle className="text-section">{me ? me.name : "Welcome to Rommie"}</SheetTitle>
            {me && <p className="flex items-center gap-1 text-foggy"><span className="capitalize">{me.role}</span>{me.studentVerified && <><span aria-hidden>·</span><BadgeCheck className="h-4 w-4 text-hof" aria-hidden/><span className="text-hof">Verified Student</span></>}</p>}
          </SheetHeader>
          <ul className="mt-2 divide-y divide-bebe">
            {items.map((i) => (<li key={i.to}>
                <Link to={i.to} onClick={() => setSheet(false)} className={cn("flex min-h-12 items-center text-base", i.strong ? "font-semibold" : "font-medium")}>{i.label}</Link>
              </li>))}
            <li><Link to="/zones" onClick={() => setSheet(false)} className="flex min-h-12 items-center text-base font-medium">Campus Zones</Link></li>
            <li><Link to="/how-verification-works" onClick={() => setSheet(false)} className="flex min-h-12 items-center text-base font-medium">How It Works</Link></li>
            {me?.role !== "admin" && (<li><Link to={postTo} onClick={() => setSheet(false)} className="flex min-h-12 items-center text-base font-medium">List a room</Link></li>)}
            {me && (<li><button onClick={() => { setSheet(false); void logout(); }} className="flex min-h-12 w-full items-center text-base font-medium">Log out</button></li>)}
          </ul>
        </SheetContent>
      </Sheet>
    </>);
}
