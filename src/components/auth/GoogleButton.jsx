import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Info, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, TextInput } from "@/components/forms/Field";
import { AuthError, getGoogleAuthUrl, loginWithGoogle } from "@/services/api";
import { emailField } from "@/lib/validation";

function GoogleG() {
    return (
        <svg viewBox="0 0 48 48" className="h-5 w-5 shrink-0" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
            <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
    );
}

const schema = z.object({
    email: emailField,
    name: z.string().trim().max(60, "Keep the name under 60 characters.").optional()
});

/**
 * "Continue with Google".
 * - When VITE_GOOGLE_CLIENT_ID is configured: redirects directly to Google's OAuth 2.0 authorization screen.
 * - If no Google client ID is configured (local dev without Google Cloud credentials):
 *   shows a modal informing the developer how to set up VITE_GOOGLE_CLIENT_ID / GOOGLE_CLIENT_ID,
 *   while offering a one-click demo sign-in so dev/test workflows continue to function without crashing.
 */
export function GoogleButton({ role = "student", onDone, label = "Continue with Google", redirect }) {
    const [open, setOpen] = useState(false);
    const [isGisLoading, setIsGisLoading] = useState(false);
    const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);

    const googleClientId = typeof import.meta !== "undefined" ? import.meta.env?.VITE_GOOGLE_CLIENT_ID : undefined;

    let searchRedirect = "";
    if (typeof window !== "undefined" && window.location) {
        try {
            searchRedirect = new URLSearchParams(window.location.search).get("redirect") || "";
        } catch {}
    }
    const effectiveRedirect = redirect || searchRedirect;

    const f = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: "", name: "" }
    });
    const { errors, isSubmitting } = f.formState;

    const handleClick = async () => {
        if (googleClientId) {
            setIsGisLoading(true);
            try {
                const authUrl = await getGoogleAuthUrl({ role, redirect: effectiveRedirect });
                if (typeof window !== "undefined") {
                    window.location.href = authUrl;
                    return;
                }
            } catch (err) {
                console.error("Failed to generate Google auth URL:", err);
                setIsGisLoading(false);
                setOpen(true);
                return;
            }
        }
        setOpen(true);
    };

    const handleQuickDemo = async () => {
        setIsSubmittingDemo(true);
        try {
            const demoEmail = role === "caretaker" ? "demo.caretaker@gmail.com" : "demo.student@gmail.com";
            const demoName = role === "caretaker" ? "Demo Caretaker" : "Demo Student";
            const user = await loginWithGoogle({ email: demoEmail, name: demoName, role });
            setOpen(false);
            if (onDone) onDone(user);
        } catch (e) {
            toast.error(e?.message || "Couldn't sign in with demo account.");
        } finally {
            setIsSubmittingDemo(false);
        }
    };

    const submit = f.handleSubmit(async (v) => {
        try {
            const user = await loginWithGoogle({ email: v.email, name: v.name, role });
            setOpen(false);
            if (onDone) onDone(user);
        } catch (e) {
            if (e instanceof AuthError) {
                f.setError("email", { message: e.message });
                if (e.message.toLowerCase().includes("suspended")) {
                    toast.error(e.message);
                }
            } else {
                toast.error(e?.message || "Couldn't sign in with Google. Try again.");
            }
        }
    });

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full gap-3 font-medium transition-colors hover:bg-surface"
                disabled={isGisLoading}
                onClick={handleClick}
            >
                {isGisLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleG />}
                {isGisLoading ? "Connecting to Google..." : label}
            </Button>

            <Dialog
                open={open}
                onOpenChange={(o) => {
                    setOpen(o);
                    if (!o) f.reset();
                }}
            >
                <DialogContent className="rounded-xl border border-deco/60 bg-card p-6 shadow-modal sm:max-w-md">
                    <DialogHeader className="space-y-2 text-left">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-deco bg-surface shadow-xs">
                                <GoogleG />
                            </div>
                            <div>
                                <DialogTitle className="text-section font-semibold text-hof">Continue with Google</DialogTitle>
                                <p className="text-xs text-foggy">Fast, verified sign-in for Rommie</p>
                            </div>
                        </div>
                        <DialogDescription className="text-sm text-foggy">
                            {googleClientId
                                ? "Redirecting to Google OAuth 2.0 authorization screen..."
                                : "Google OAuth 2.0 is running in local development mode."}
                        </DialogDescription>
                    </DialogHeader>

                    {!googleClientId && (
                        <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3 text-xs text-sky-950">
                            <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-semibold text-sky-900">Setup Google Cloud OAuth 2.0</p>
                                    <p className="text-sky-800 leading-relaxed">
                                        To enable live Google OAuth in production, set <code className="rounded bg-sky-100 px-1 py-0.5 font-mono">VITE_GOOGLE_CLIENT_ID</code> in frontend and <code className="rounded bg-sky-100 px-1 py-0.5 font-mono">GOOGLE_CLIENT_ID</code> / <code className="rounded bg-sky-100 px-1 py-0.5 font-mono">GOOGLE_CLIENT_SECRET</code> in <code className="rounded bg-sky-100 px-1 py-0.5 font-mono">backend/.env</code>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!googleClientId && (
                        <div className="space-y-2 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="w-full gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-medium"
                                disabled={isSubmittingDemo || isSubmitting}
                                onClick={handleQuickDemo}
                            >
                                {isSubmittingDemo ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                {isSubmittingDemo ? "Signing in..." : `One-Click Demo ${role === "caretaker" ? "Caretaker" : "Student"} Sign-In`}
                            </Button>
                            <div className="relative py-1 text-center text-xs text-foggy">
                                <span className="relative bg-card px-2">or test with custom email</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={submit} noValidate className="mt-2 space-y-4">
                        <Field label="Google email" error={errors.email?.message} required>
                            {(p) => (
                                <TextInput
                                    {...p}
                                    type="email"
                                    autoComplete="email"
                                    inputMode="email"
                                    placeholder="you@gmail.com"
                                    autoFocus
                                    {...f.register("email")}
                                />
                            )}
                        </Field>

                        <Field
                            label="Your name"
                            error={errors.name?.message}
                            hint="Only needed for new accounts."
                            optional
                        >
                            {(p) => (
                                <TextInput
                                    {...p}
                                    autoComplete="name"
                                    placeholder="e.g. Grace Wanjiru"
                                    {...f.register("name")}
                                />
                            )}
                        </Field>

                        <div className="pt-2">
                            <Button type="submit" size="lg" className="w-full gap-2 font-medium" disabled={isSubmitting || isSubmittingDemo}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                                    </>
                                ) : (
                                    <>
                                        <GoogleG /> Continue with Google
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function OrDivider() {
    return (
        <div className="my-5 flex items-center gap-3 text-sm text-foggy" role="separator" aria-label="or">
            <span className="h-px flex-1 bg-deco" /> or <span className="h-px flex-1 bg-deco" />
        </div>
    );
}
