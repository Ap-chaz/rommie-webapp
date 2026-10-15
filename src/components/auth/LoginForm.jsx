import { useState } from "react";
import { Link, useNavigate } from "@/lib/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/forms/Field";
import { OtpBoxes } from "@/components/auth/OtpBoxes";
import { ResendCode, useResend } from "@/components/auth/ResendCode";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthError, login, loginWithOtp, sendOtp } from "@/services/api";
import { useGoAfterAuth, useRedirectIfSignedIn } from "@/lib/auth";
import { normalizeKenyanPhone } from "@/lib/format";
import { phoneField } from "@/lib/validation";
import { cn } from "@/lib/utils";
const pwSchema = z.object({ phone: phoneField, password: z.string().min(1, "Enter your password.") });
const phoneOnly = z.object({ phone: phoneField });
export function LoginForm({ role, redirect }) {
    const caretaker = role === "caretaker";
    const [mode, setMode] = useState(caretaker ? "code" : "password");
    const navigate = useNavigate();
    const goAfter = useGoAfterAuth();
    useRedirectIfSignedIn(redirect);
    const finish = (user) => {
        toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
        if (!user.phoneVerified) {
            void navigate({ to: "/verify-phone", search: redirect ? { redirect } : {} });
        }
        else
            goAfter(user, redirect);
    };
    const signupTo = caretaker ? "/caretaker/signup" : "/signup";
    return (<AuthShell title={caretaker ? "Caretaker log in" : "Log in"} subtitle={caretaker ? "Manage your rooms and keep your vacancies fresh." : "Find rooms and get alerts when new ones open."} footer={<div className="space-y-1">
          <p>
            New here?{" "}
            <Link to={signupTo} search={redirect ? { redirect } : {}} className="font-medium text-hof underline">Create an account</Link>
          </p>
          <p>
            {caretaker ? (<Link to="/login" search={redirect ? { redirect } : {}} className="underline">Looking for a room? Student log in</Link>) : (<Link to="/caretaker/login" search={redirect ? { redirect } : {}} className="underline">Are you a caretaker? Log in here</Link>)}
          </p>
        </div>}>
      <div role="tablist" aria-label="Log in method" className="mb-6 grid grid-cols-2 rounded-full bg-faint p-1">
        {["password", "code"].map((m) => (<button key={m} role="tab" type="button" aria-selected={mode === m} onClick={() => setMode(m)} className={cn("min-h-10 rounded-full text-sm font-medium transition-colors", mode === m ? "bg-card text-hof shadow-search" : "text-foggy hover:text-hof")}>
            {m === "password" ? "Password" : "Text me a code"}
          </button>))}
      </div>
      {mode === "password" ? <PasswordLogin onDone={finish}/> : <CodeLogin onDone={finish}/>}
    </AuthShell>);
}
function PasswordLogin({ onDone }) {
    const f = useForm({ resolver: zodResolver(pwSchema), defaultValues: { phone: "", password: "" } });
    const { errors, isSubmitting } = f.formState;
    const submit = f.handleSubmit(async (v) => {
        try {
            onDone(await login({ phone: normalizeKenyanPhone(v.phone), password: v.password }));
        }
        catch (e) {
            if (e instanceof AuthError)
                f.setError(e.field === "phone" ? "phone" : "password", { message: e.message });
            else
                toast.error("Couldn't log in. Check your connection and try again.");
        }
    });
    return (<form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Phone number" error={errors.phone?.message} required>
        {(p) => <TextInput {...p} type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" {...f.register("phone")}/>}
      </Field>
      <Field label="Password" error={errors.password?.message} required>
        {(p) => <TextInput {...p} type="password" autoComplete="current-password" {...f.register("password")}/>}
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin"/>} Log in
      </Button>
    </form>);
}
function CodeLogin({ onDone }) {
    const f = useForm({ resolver: zodResolver(phoneOnly), defaultValues: { phone: "" } });
    const [sentTo, setSentTo] = useState(null);
    const [code, setCode] = useState("");
    const [codeError, setCodeError] = useState();
    const [busy, setBusy] = useState(false);
    const { left, restart } = useResend();
    const send = f.handleSubmit(async (v) => {
        const phone = normalizeKenyanPhone(v.phone);
        await sendOtp(phone);
        setSentTo(phone);
        restart();
    });
    const verify = async (value) => {
        if (!sentTo)
            return;
        setBusy(true);
        setCodeError(undefined);
        try {
            onDone(await loginWithOtp(sentTo, value));
        }
        catch (e) {
            setCodeError(e instanceof AuthError ? e.message : "Couldn't verify the code. Try again.");
            setCode("");
        }
        finally {
            setBusy(false);
        }
    };
    if (!sentTo) {
        return (<form onSubmit={send} noValidate className="space-y-4">
        <Field label="Phone number" error={f.formState.errors.phone?.message} required>
          {(p) => <TextInput {...p} type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" {...f.register("phone")}/>}
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={f.formState.isSubmitting}>
          {f.formState.isSubmitting && <Loader2 className="animate-spin"/>} Send code
        </Button>
      </form>);
    }
    return (<div className="space-y-4 text-center">
      <p>Enter the 6-digit code we sent to <span className="font-medium">{sentTo}</span>.</p>
      <OtpBoxes value={code} onChange={(v) => { setCode(v); setCodeError(undefined); }} onComplete={verify} disabled={busy} invalid={!!codeError} autoFocus/>
      {codeError && <p role="alert" className="text-sm font-medium">{codeError}</p>}
      {busy && <p className="flex items-center justify-center gap-2 text-foggy"><Loader2 className="h-4 w-4 animate-spin"/> Checking…</p>}
      <p className="text-sm text-foggy">Demo mode: use 123456.</p>
      <ResendCode left={left} onResend={async () => { await sendOtp(sentTo); restart(); setCodeError(undefined); toast("New code sent"); }}/>
      <div><button type="button" className="min-h-11 text-foggy underline" onClick={() => { setSentTo(null); setCode(""); setCodeError(undefined); }}>Use a different number</button></div>
    </div>);
}
