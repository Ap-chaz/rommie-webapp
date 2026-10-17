import { usePageMeta } from "@/lib/usePageMeta";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpBoxes } from "@/components/auth/OtpBoxes";
import { ResendCode, useResend } from "@/components/auth/ResendCode";
import { Button } from "@/components/ui/button";
import { redirectSearch, useAuth, useGoAfterAuth, useLogout } from "@/lib/auth";
import { AuthError, otpMessage, sendOtp, setMyPhone, verifyOtp } from "@/services/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, TextInput } from "@/components/forms/Field";
import { normalizeKenyanPhone } from "@/lib/format";
import { phoneField } from "@/lib/validation";
import { useNavigate, useSearch } from "@/lib/router";
const PAGE_META = [{ title: "Verify your phone · Rommie" }, { name: "robots", content: "noindex" }];
const phoneOnly = z.object({ phone: phoneField });
const mask = (p) => `${p.slice(0, 4)} ${p[4] ?? ""}•• ••• ${p.slice(-3)}`;
export default function VerifyPhone() {
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
    // Signed out -> log in. Already verified (including right after a successful check) -> continue.
    useEffect(() => {
        if (!ready)
            return;
        if (!user)
            void navigate({ to: "/login", search: redirect ? { redirect } : {}, replace: true });
        else if (user.phoneVerified)
            goAfter(user, redirect);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, user, redirect]);
    // Send the first code once per number.
    const phone = user?.phone;
    useEffect(() => {
        if (!phone || user?.phoneVerified || sentFor.current === phone)
            return;
        sentFor.current = phone;
        void sendOtp(phone);
        restart();
    }, [phone, user?.phoneVerified, restart]);
    if (!ready || !user || user.phoneVerified) {
        return <div className="page-container py-10"><div className="mx-auto h-64 max-w-md animate-pulse rounded-xl bg-deco"/></div>;
    }
    if (!user.phone)
        return <AddPhone logout={logout}/>;
    const check = async (value) => {
        setBusy(true);
        setError(undefined);
        try {
            const res = await verifyOtp(user.phone, value);
            if (res.ok)
                toast.success("Phone verified");
            else {
                setError(otpMessage(res.reason));
                setCode("");
            }
        }
        catch {
            setError("Couldn't check the code. Check your connection and try again.");
        }
        finally {
            setBusy(false);
        }
    };
    const resend = async () => {
        setSending(true);
        setError(undefined);
        setCode("");
        try {
            await sendOtp(user.phone);
            restart();
            toast("New code sent");
        }
        catch {
            setError("Couldn't send a new code. Try again in a moment.");
        }
        finally {
            setSending(false);
        }
    };
    return (<AuthShell title="Verify your phone" subtitle={`Enter the 6-digit code we sent to ${mask(user.phone)}.`} footer={<button className="min-h-11 underline" onClick={logout}>Not you? Log out</button>}>
      <div className="space-y-4 text-center">
        <OtpBoxes value={code} onChange={(v) => { setCode(v); setError(undefined); }} onComplete={check} disabled={busy} invalid={!!error} autoFocus/>
        {error && <p role="alert" className="text-sm font-medium">{error}</p>}
        <Button className="w-full" size="lg" disabled={code.length < 6 || busy} onClick={() => check(code)}>
          {busy && <Loader2 className="animate-spin"/>} Verify
        </Button>
        <p className="text-sm text-foggy">Demo mode: use 123456.</p>
        <ResendCode left={left} onResend={resend} disabled={sending}/>
      </div>
    </AuthShell>);
}

/** Google accounts start without a phone number. Caretakers need one for WhatsApp and calls, students for alerts. */
function AddPhone({ logout }) {
    const f = useForm({ resolver: zodResolver(phoneOnly), defaultValues: { phone: "" } });
    const { errors, isSubmitting } = f.formState;
    const submit = f.handleSubmit(async (v) => {
        try {
            await setMyPhone(normalizeKenyanPhone(v.phone));
        }
        catch (e) {
            if (e instanceof AuthError)
                f.setError("phone", { message: e.message });
            else
                toast.error("Couldn't save your number. Try again.");
        }
    });
    return (<AuthShell title="Add your phone number" subtitle="We'll text you a code to confirm it." footer={<button className="min-h-11 underline" onClick={logout}>Not you? Log out</button>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Phone number" error={errors.phone?.message} required>
          {(p) => <TextInput {...p} type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" {...f.register("phone")}/>}
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin"/>} Send code
        </Button>
      </form>
    </AuthShell>);
}
