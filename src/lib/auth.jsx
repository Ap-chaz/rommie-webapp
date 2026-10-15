import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, useCurrentHref, useNavigate } from "@/lib/router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getSession, logout as apiLogout, subscribeSession } from "@/services/api";
const noopSubscribe = () => () => { };
/** Current user plus `ready` (always true in this client-only app; kept so guards read the same as with SSR). */
export function useAuth() {
    const user = useSyncExternalStore(subscribeSession, getSession, () => null);
    const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
    return { user, ready };
}
export function homeFor(role) {
    return role === "caretaker" ? "/caretaker/listings" : role === "admin" ? "/admin" : "/rooms";
}
/** Only allow same-site paths as post-login redirects (blocks open redirects like //evil.com). */
export function safeRedirect(r) {
    return r && r.startsWith("/") && !r.startsWith("//") && !r.startsWith("/\\") ? r : undefined;
}
export function useLogout() {
    const navigate = useNavigate();
    return async () => {
        await apiLogout();
        toast("Logged out");
        await navigate({ to: "/" });
    };
}
/** Where to go once someone is signed in and verified. */
export function useGoAfterAuth() {
    const navigate = useNavigate();
    return (user, redirect) => {
        const dest = safeRedirect(redirect) ?? homeFor(user.role);
        navigate({ to: dest });
    };
}
/**
 * Run `onAuthed` for signed-in users; send visitors to log in and bring them back here afterwards.
 */
export function useAuthGate() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const href = useCurrentHref();
    return (message, onAuthed) => {
        if (user)
            return onAuthed(user);
        toast(message);
        void navigate({ to: "/login", search: { redirect: href } });
    };
}
function GuardPlaceholder() {
    return (<div className="page-container py-10" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-deco"/>
      <div className="mt-6 h-40 max-w-xl animate-pulse rounded-xl bg-deco"/>
    </div>);
}
const roleNoun = { student: "students", caretaker: "caretakers", admin: "admins" };
/**
 * Route guard. Visitors go to login (and return afterwards), unverified phones go to OTP,
 * and signed-in people with the wrong role see a friendly explanation instead of a redirect loop.
 */
export function RequireRole({ roles, loginPath = "/login", children, }) {
    const { user, ready } = useAuth();
    const navigate = useNavigate();
    const href = useCurrentHref();
    // Remember where the guard was first shown, so the redirect target can't become the login page itself
    // while the navigation away is still in flight.
    const [at] = useState(href);
    const logout = useLogout();
    useEffect(() => {
        if (!ready || href !== at)
            return;
        if (!user)
            void navigate({ to: loginPath, search: { redirect: href }, replace: true });
        else if (!user.phoneVerified)
            void navigate({ to: "/verify-phone", search: { redirect: href }, replace: true });
    }, [ready, user, loginPath, href, at, navigate]);
    if (!ready || !user || !user.phoneVerified)
        return <GuardPlaceholder />;
    if (!roles.includes(user.role)) {
        return (<div className="page-container py-20 text-center">
        <h1 className="text-page">This page isn't for your account</h1>
        <p className="mx-auto mt-3 max-w-md text-foggy">
          It's only available to {roles.map((r) => roleNoun[r]).join(" and ")}. You're signed in as a {user.role}.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild><Link to={homeFor(user.role)}>Go to my page</Link></Button>
          <Button variant="outline" onClick={logout}>Log out</Button>
        </div>
      </div>);
    }
    return <>{children}</>;
}
/** validateSearch for pages that accept ?redirect=/some/path */
export const redirectSearch = (s) => {
    const r = safeRedirect(typeof s["redirect"] === "string" ? s["redirect"] : undefined);
    return r ? { redirect: r } : {};
};
/** Send already-signed-in (and verified) people away from login/signup pages. */
export function useRedirectIfSignedIn(redirect) {
    const { user, ready } = useAuth();
    const goAfter = useGoAfterAuth();
    useEffect(() => {
        if (ready && user && user.phoneVerified)
            goAfter(user, redirect);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, user, redirect]);
}
