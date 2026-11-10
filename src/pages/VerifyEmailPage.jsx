import { usePageMeta } from "@/lib/usePageMeta";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpBoxes } from "@/components/auth/OtpBoxes";
import { ResendCode, useResend } from "@/components/auth/ResendCode";
import { Button } from "@/components/ui/button";
import { redirectSearch, useAuth, useGoAfterAuth, useLogout } from "@/lib/auth";
import { otpMessage, sendOtp, verifyOtp } from "@/services/api";
import { useNavigate, useSearch } from "@/lib/router";

const PAGE_META = [{ title: "Verify your email · Rommie" }, { name: "robots", content: "noindex" }];

export default function VerifyEmailPage() {
    usePageMeta(PAGE_META);
    const { redirect } = useSearch(redirectSearch);
    const { user, ready } = useAuth();
    const navigate = useNavigate();
    const goAfter = useGoAfterAuth();
    const logout = useLogout();
    const [code, setCode] = useState("");
    const [error, setError] = useState();
    const [busy, setBusy] = useState(false);
    const [sending, setSending] = useState(false);
    const { left, restart } = useResend();
    const sentFor = useRef(null);

    const isVerified = Boolean(user?.emailVerified ?? user?.phoneVerified);

    // Signed out -> log in. Already verified -> continue.
    useEffect(() => {
        if (!ready)
            return;
        if (!user)
            void navigate({ to: "/login", search: redirect ? { redirect } : {}, replace: true });
        else if (isVerified)
            goAfter(user, redirect);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, user, isVerified, redirect]);

    // Send the first verification code once per email.
    const email = user?.email;
    useEffect(() => {
        if (!email || isVerified || sentFor.current === email)
            return;
        sentFor.current = email;
        void sendOtp(email);
        restart();
    }, [email, isVerified, restart]);

    if (!ready || !user || isVerified) {
        return (
            <div className="page-container py-10">
                <div className="mx-auto h-64 max-w-md animate-pulse rounded-xl bg-deco" />
            </div>
        );
    }

    const check = async (value) => {
        setBusy(true);
        setError(undefined);
        try {
            const target = user.email || user.phone;
            const res = await verifyOtp(target, value);
            if (res.ok) {
                toast.success("Email verified");
                goAfter({ ...user, emailVerified: true, phoneVerified: true }, redirect);
            } else {
                setError(otpMessage(res.reason));
                setCode("");
            }
        } catch {
            setError("Couldn't check the code. Check your connection and try again.");
        } finally {
            setBusy(false);
        }
    };

    const resend = async () => {
        setSending(true);
        setError(undefined);
        setCode("");
        try {
            const target = user.email || user.phone;
            await sendOtp(target);
            restart();
            toast("New code sent to your email");
        } catch {
            setError("Couldn't send a new code. Try again in a moment.");
        } finally {
            setSending(false);
        }
    };

    return (
        <AuthShell
            title="Verify your email"
            subtitle={`Enter the 6-digit verification code we sent to ${user.email}.`}
            footer={<button className="min-h-11 underline" onClick={logout}>Not you? Log out</button>}
        >
            <div className="space-y-4 text-center">
                <OtpBoxes
                    value={code}
                    onChange={(v) => { setCode(v); setError(undefined); }}
                    onComplete={check}
                    disabled={busy}
                    invalid={!!error}
                    autoFocus
                />
                {error && <p role="alert" className="text-sm font-medium">{error}</p>}
                <Button className="w-full" size="lg" disabled={code.length < 6 || busy} onClick={() => check(code)}>
                    {busy && <Loader2 className="animate-spin" />} Verify email
                </Button>
                <p className="text-sm text-foggy">Demo mode: use 123456.</p>
                <ResendCode left={left} onResend={resend} disabled={sending} />
            </div>
        </AuthShell>
    );
}
