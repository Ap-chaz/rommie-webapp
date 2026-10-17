import { useMemo } from "react";
import { Link, useNavigate } from "@/lib/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, PasswordInput, SelectInput, TextInput } from "@/components/forms/Field";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { AuthError, signUp } from "@/services/api";
import { useGoAfterAuth, useRedirectIfSignedIn } from "@/lib/auth";
import { CAMPUSES, normalizeKenyanPhone } from "@/lib/format";
import { emailField, passwordField, phoneField } from "@/lib/validation";
const OTHER_SCHOOL = "other";
/** Students must say where they study; caretakers don't have a school, so that part is skipped for them. */
const makeSchema = (needsSchool) => z.object({
    firstName: z.string().trim().min(2, "Enter your first name."),
    lastName: z.string().trim().min(2, "Enter your last name."),
    school: z.string(),
    schoolOther: z.string().trim(),
    email: emailField,
    phone: phoneField,
    password: passwordField,
}).superRefine((v, ctx) => {
    if (!needsSchool)
        return;
    if (!v.school)
        ctx.addIssue({ code: "custom", path: ["school"], message: "Choose your school." });
    else if (v.school === OTHER_SCHOOL && v.schoolOther.length < 2)
        ctx.addIssue({ code: "custom", path: ["schoolOther"], message: "Enter the name of your school." });
});
export function SignupForm({ role, redirect }) {
    const caretaker = role === "caretaker";
    const navigate = useNavigate();
    const goAfter = useGoAfterAuth();
    useRedirectIfSignedIn(redirect);
    const schema = useMemo(() => makeSchema(!caretaker), [caretaker]);
    const f = useForm({ resolver: zodResolver(schema), defaultValues: { firstName: "", lastName: "", school: "", schoolOther: "", email: "", phone: "", password: "" } });
    const { errors, isSubmitting } = f.formState;
    const school = f.watch("school");
    const submit = f.handleSubmit(async (v) => {
        try {
            const schoolName = v.school === OTHER_SCHOOL ? v.schoolOther : CAMPUSES.find((c) => c.id === v.school)?.name;
            await signUp({
                name: `${v.firstName} ${v.lastName}`,
                firstName: v.firstName,
                lastName: v.lastName,
                ...(!caretaker && schoolName ? { school: schoolName } : {}),
                email: v.email,
                phone: normalizeKenyanPhone(v.phone),
                password: v.password,
                role,
            });
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" error={errors.firstName?.message} required>
            {(p) => <TextInput {...p} autoComplete="given-name" {...f.register("firstName")}/>}
          </Field>
          <Field label="Last name" error={errors.lastName?.message} required>
            {(p) => <TextInput {...p} autoComplete="family-name" {...f.register("lastName")}/>}
          </Field>
        </div>
        {!caretaker && (<>
          <Field label="School" error={errors.school?.message} required>
            {(p) => (<SelectInput {...p} {...f.register("school")}>
                <option value="">Choose your school</option>
                {CAMPUSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value={OTHER_SCHOOL}>Other</option>
              </SelectInput>)}
          </Field>
          {school === OTHER_SCHOOL && (<Field label="School name" error={errors.schoolOther?.message} required>
              {(p) => <TextInput {...p} autoComplete="organization" {...f.register("schoolOther")}/>}
            </Field>)}
        </>)}
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
