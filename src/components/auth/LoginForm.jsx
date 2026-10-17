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
import { AuthError, login } from "@/services/api";
import { useGoAfterAuth, useRedirectIfSignedIn } from "@/lib/auth";
import { emailField } from "@/lib/validation";

const schema = z.object({ email: emailField, password: z.string().min(1, "Enter your password.") });

export function LoginForm({ role, redirect }) {
    const caretaker = role === "caretaker";
    const navigate = useNavigate();
    const goAfter = useGoAfterAuth();
    useRedirectIfSignedIn(redirect);
    const f = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
    const { errors, isSubmitting } = f.formState;
    const finish = (user) => {
        toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
        // Anyone without a confirmed phone number (including new Google accounts) confirms it first.
        if (!user.phoneVerified)
            void navigate({ to: "/verify-phone", search: redirect ? { redirect } : {} });
        else
            goAfter(user, redirect);
    };
    const submit = f.handleSubmit(async (v) => {
        try {
            finish(await login({ email: v.email, password: v.password }));
        }
        catch (e) {
            if (e instanceof AuthError)
                f.setError(e.field === "email" ? "email" : "password", { message: e.message });
            else
                toast.error("Couldn't log in. Check your connection and try again.");
        }
    });
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
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Email" error={errors.email?.message} required>
          {(p) => <TextInput {...p} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" {...f.register("email")}/>}
        </Field>
        <Field label="Password" error={errors.password?.message} required>
          {(p) => <PasswordInput {...p} autoComplete="current-password" {...f.register("password")}/>}
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin"/>} Log in
        </Button>
      </form>
      <OrDivider />
      <GoogleButton role={role} onDone={finish}/>
    </AuthShell>);
}
