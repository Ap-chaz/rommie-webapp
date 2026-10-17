import { Link, useNavigate } from "@/lib/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, PasswordInput, TextInput } from "@/components/forms/Field";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { AuthError, signUp } from "@/services/api";
import { useGoAfterAuth, useRedirectIfSignedIn } from "@/lib/auth";
import { normalizeKenyanPhone } from "@/lib/format";
import { emailField, passwordField, phoneField } from "@/lib/validation";
const schema = z.object({
    name: z.string().trim().min(2, "Enter your full name."),
    email: emailField,
    phone: phoneField,
    password: passwordField,
});
export function SignupForm({ role, redirect }) {
    const caretaker = role === "caretaker";
    const navigate = useNavigate();
    const goAfter = useGoAfterAuth();
    useRedirectIfSignedIn(redirect);
    const f = useForm({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", phone: "", password: "" } });
    const { errors, isSubmitting } = f.formState;
    const submit = f.handleSubmit(async (v) => {
        try {
            await signUp({ name: v.name, email: v.email, phone: normalizeKenyanPhone(v.phone), password: v.password, role });
            toast.success("Account created. Let's verify your number.");
            await navigate({ to: "/verify-phone", search: redirect ? { redirect } : {} });
        }
        catch (e) {
            if (e instanceof AuthError && e.field && e.field !== "code")
                f.setError(e.field, { message: e.message });
            else
                toast.error("Couldn't create your account. Check your connection and try again.");
        }
    });
    return (<AuthShell title={caretaker ? "List your rooms" : "Create your account"} subtitle={caretaker ? "Free for caretakers and landlords. Post a room in about two minutes." : "Save rooms and get a text when a matching room opens."} footer={<div className="space-y-1">
          <p>
            Already have an account?{" "}
            <Link to={caretaker ? "/caretaker/login" : "/login"} search={redirect ? { redirect } : {}} className="font-medium text-hof underline">Log in</Link>
          </p>
          <p>
            {caretaker ? (<Link to="/signup" search={redirect ? { redirect } : {}} className="underline">Looking for a room? Student sign up</Link>) : (<Link to="/caretaker/signup" search={redirect ? { redirect } : {}} className="underline">Are you a caretaker? Sign up here</Link>)}
          </p>
        </div>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Full name" error={errors.name?.message} required>
          {(p) => <TextInput {...p} autoComplete="name" {...f.register("name")}/>}
        </Field>
        <Field label="Email" error={errors.email?.message} required>
          {(p) => <TextInput {...p} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" {...f.register("email")}/>}
        </Field>
        <Field label="Phone number" error={errors.phone?.message} hint="We'll text you a code to confirm it." required>
          {(p) => <TextInput {...p} type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" {...f.register("phone")}/>}
        </Field>
        <Field label="Password" error={errors.password?.message} hint="At least 8 characters." required>
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...f.register("password")}/>}
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin"/>} Continue
        </Button>
        <p className="text-center text-xs text-foggy">
          By continuing you agree to the <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>
      <OrDivider />
      <GoogleButton role={role} label="Sign up with Google" onDone={(user) => {
            toast.success(`Welcome, ${user.name.split(" ")[0]}`);
            if (user.phoneVerified)
                goAfter(user, redirect);
            else
                void navigate({ to: "/verify-phone", search: redirect ? { redirect } : {} });
        }}/>

    </AuthShell>);
}
