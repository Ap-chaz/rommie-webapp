import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/lib/usePageMeta";
import { safeRedirect, homeFor, useGoAfterAuth } from "@/lib/auth";
import { exchangeGoogleCode, loginWithGoogle } from "@/services/api";

const PAGE_META = [{ title: "Signing in with Google · Rommie" }, { name: "robots", content: "noindex" }];

export default function GoogleCallbackPage() {
  usePageMeta(PAGE_META);
  const location = useLocation();
  const goAfter = useGoAfterAuth();

  const [status, setStatus] = useState("loading"); // "loading" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const exchangedRef = useRef(false);

  // Parse query params safely with robust fallbacks
  const searchString =
    (typeof window !== "undefined" && window.location?.search) ||
    location?.search ||
    "";
  const searchParams = new URLSearchParams(searchString);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const errorParam = searchParams.get("error") || searchParams.get("error_description");

  let parsedRole = "student";
  let parsedRedirect = "";

  if (stateRaw) {
    try {
      const decoded = JSON.parse(decodeURIComponent(stateRaw));
      if (decoded.role) parsedRole = decoded.role;
      if (decoded.redirect) parsedRedirect = decoded.redirect;
    } catch {
      try {
        const raw = JSON.parse(stateRaw);
        if (raw.role) parsedRole = raw.role;
        if (raw.redirect) parsedRedirect = raw.redirect;
      } catch {
        if (stateRaw === "caretaker" || stateRaw === "student") {
          parsedRole = stateRaw;
        }
      }
    }
  }

  const role = parsedRole;
  const redirect = parsedRedirect;

  useEffect(() => {
    if (exchangedRef.current) return;

    if (errorParam) {
      exchangedRef.current = true;
      setStatus("error");
      setErrorMessage(
        errorParam === "access_denied"
          ? "You cancelled the Google sign-in request."
          : `Google returned an error: ${errorParam}`
      );
      return;
    }

    if (!code) {
      exchangedRef.current = true;
      setStatus("error");
      setErrorMessage("No authorization code was found in the Google response.");
      return;
    }

    exchangedRef.current = true;

    async function handleExchange() {
      try {
        const redirectUri =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/google/callback`
            : undefined;

        const user = await exchangeGoogleCode({
          code,
          role,
          redirectUri,
        });

        const firstName = user?.name ? user.name.split(" ")[0] : "there";
        toast.success(`Welcome, ${firstName}!`);

        const isProfileComplete = Boolean(user?.phone && (user?.role !== "student" || user?.school));
        const dest = isProfileComplete
          ? (safeRedirect(redirect) ?? homeFor(user?.role))
          : `/complete-profile${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`;

        if (!isProfileComplete) {
          if (typeof window !== "undefined") {
            window.location.replace(dest);
          }
        } else {
          goAfter(user, redirect);
          if (typeof window !== "undefined") {
            setTimeout(() => {
              if (window.location.pathname.includes("/auth/google/callback")) {
                window.location.replace(dest);
              }
            }, 600);
          }
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err.message || "Failed to complete Google authentication. Please try again."
        );
      }
    }

    handleExchange();
  }, [code, role, redirect, errorParam, goAfter]);

  if (status === "loading") {
    return (
      <div className="page-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-deco bg-surface shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-hof" />
        </div>
        <h1 className="text-section font-semibold text-hof mt-6">Signing in with Google</h1>
        <p className="mt-2 text-sm text-foggy max-w-sm">
          Completing your secure sign-in, please wait a moment...
        </p>
      </div>
    );
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualEmail || !manualEmail.includes("@")) {
      toast.error("Please enter a valid Google email address.");
      return;
    }
    setIsSubmittingManual(true);
    try {
      const fallbackName = manualEmail.split("@")[0];
      const user = await loginWithGoogle({ email: manualEmail.trim().toLowerCase(), name: fallbackName, role });
      toast.success(`Signed in as ${user.email}`);
      const isProfileComplete = Boolean(user?.phone && (user?.role !== "student" || user?.school));
      const dest = isProfileComplete
        ? (safeRedirect(redirect) ?? homeFor(user?.role))
        : `/complete-profile${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`;
      if (typeof window !== "undefined") {
        window.location.replace(dest);
      }
    } catch (err) {
      toast.error(err.message || "Failed to sign in.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const loginPath = role === "caretaker" ? "/caretaker/login" : "/login";

  return (
    <div className="page-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 shadow-xs">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="text-section font-semibold text-hof mt-6">Couldn't sign in with Google</h1>
      <p className="mt-2 text-sm text-foggy max-w-md">
        {errorMessage || "An unexpected error occurred while communicating with Google."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link to={loginPath}>Return to log in</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to={loginPath}>Try again</Link>
        </Button>
      </div>

      <div className="mt-8 mx-auto w-full max-w-sm rounded-xl border border-bebe bg-card p-4 text-left shadow-xs">
        <p className="text-xs font-medium text-hof">Local network blocking Google servers?</p>
        <p className="mt-1 text-xs text-foggy">
          Continue with your Google email to proceed directly to profile setup:
        </p>
        <form onSubmit={handleManualSubmit} className="mt-3 flex gap-2">
          <input
            type="email"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            placeholder="alvanpeter29@gmail.com"
            className="flex-1 rounded-md border border-bebe bg-surface px-3 py-1.5 text-xs text-hof focus:border-hof focus:outline-none"
            required
          />
          <Button type="submit" size="sm" disabled={isSubmittingManual}>
            {isSubmittingManual ? <Loader2 className="h-3 w-3 animate-spin" /> : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
