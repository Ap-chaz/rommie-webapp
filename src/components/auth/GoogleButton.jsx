import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, TextInput } from "@/components/forms/Field";
import { AuthError, loginWithGoogle } from "@/services/api";
import { emailField } from "@/lib/validation";

function GoogleG() {
    return (<svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z"/>
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
    </svg>);
}
const schema = z.object({ email: emailField, name: z.string().trim().max(60, "Keep the name under 60 characters.") });

/**
 * "Continue with Google". Today this opens a small demo dialog standing in for Google's account picker,
 * because a real sign-in needs a Google Cloud client ID and a backend. Swap `loginWithGoogle` in the service layer later.
 */
export function GoogleButton({ role, onDone, label = "Continue with Google" }) {
    const [open, setOpen] = useState(false);
    const f = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", name: "" } });
    const { errors, isSubmitting } = f.formState;
    const submit = f.handleSubmit(async (v) => {
        try {
            const user = await loginWithGoogle({ email: v.email, name: v.name, role });
            setOpen(false);
            onDone(user);
        }
        catch (e) {
            if (e instanceof AuthError)
                f.setError("email", { message: e.message });
            else
                toast.error("Couldn't sign in with Google. Try again.");
        }
    });
    return (<>
      <Button type="button" variant="outline" size="lg" className="w-full gap-3" onClick={() => setOpen(true)}>
        <GoogleG /> {label}
      </Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o)
        f.reset(); }}>
        <DialogContent className="rounded-xl border-0 shadow-modal sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-section">Continue with Google</DialogTitle>
            <DialogDescription>Demo only. Real Google sign-in will replace this step once it is connected. Use any email.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} noValidate className="space-y-4">
            <Field label="Google email" error={errors.email?.message} required>
              {(p) => <TextInput {...p} type="email" autoComplete="email" inputMode="email" placeholder="you@gmail.com" {...f.register("email")}/>}
            </Field>
            <Field label="Your name" error={errors.name?.message} hint="Only needed the first time." optional>
              {(p) => <TextInput {...p} autoComplete="name" {...f.register("name")}/>}
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin"/>} Continue
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>);
}
export function OrDivider() {
    return (<div className="my-5 flex items-center gap-3 text-sm text-foggy" role="separator" aria-label="or">
      <span className="h-px flex-1 bg-deco"/> or <span className="h-px flex-1 bg-deco"/>
    </div>);
}
