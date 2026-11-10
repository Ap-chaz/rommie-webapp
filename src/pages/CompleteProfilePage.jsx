import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, GraduationCap, Building2, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearch } from "@/lib/router";
import { usePageMeta } from "@/lib/usePageMeta";
import { useAuth, useGoAfterAuth, redirectSearch } from "@/lib/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, TextInput } from "@/components/forms/Field";
import { Button } from "@/components/ui/button";
import { phoneField } from "@/lib/validation";
import { CAMPUSES, normalizeKenyanPhone } from "@/lib/format";
import { updateProfile, AuthError } from "@/services/api";

const PAGE_META = [{ title: "Complete Your Profile · Rommie" }, { name: "robots", content: "noindex" }];

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  role: z.enum(["student", "caretaker"]),
  phone: phoneField,
  school: z.string().optional(),
  customSchool: z.string().optional(),
  area: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === "student") {
    if (!data.school || data.school === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["school"],
        message: "Please select your university or campus.",
      });
    } else if (data.school === "Other" && (!data.customSchool || data.customSchool.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customSchool"],
        message: "Please enter your university name.",
      });
    }
  }
});

export default function CompleteProfilePage() {
  usePageMeta(PAGE_META);
  const { user } = useAuth();
  const navigate = useNavigate();
  const goAfter = useGoAfterAuth();
  const { redirect } = useSearch(redirectSearch);

  const [selectedRole, setSelectedRole] = useState(user?.role === "caretaker" ? "caretaker" : "student");
  const [selectedSchool, setSelectedSchool] = useState(user?.school || CAMPUSES[0]?.name || "");

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || "",
      role: user?.role === "caretaker" ? "caretaker" : "student",
      phone: user?.phone || "",
      school: user?.school || CAMPUSES[0]?.name || "",
      customSchool: "",
      area: "Karen",
    },
  });

  const { errors, isSubmitting } = form.formState;

  // Sync form when user is loaded
  useEffect(() => {
    if (user) {
      if (user.name && !form.getValues("name")) {
        form.setValue("name", user.name);
      }
      if (user.phone && !form.getValues("phone")) {
        form.setValue("phone", user.phone);
      }
      if (user.role) {
        setSelectedRole(user.role);
        form.setValue("role", user.role);
      }
      if (user.school) {
        setSelectedSchool(user.school);
        form.setValue("school", user.school);
      }
    }
  }, [user, form]);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    form.setValue("role", role);
  };

  const handleSchoolChange = (e) => {
    const val = e.target.value;
    setSelectedSchool(val);
    form.setValue("school", val);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const normalizedPhone = normalizeKenyanPhone(values.phone) || values.phone.trim();
      const finalSchool = values.role === "student"
        ? (values.school === "Other" ? values.customSchool?.trim() : values.school)
        : null;

      const payload = {
        name: values.name.trim(),
        role: values.role,
        phone: normalizedPhone,
        school: finalSchool,
        area: values.role === "caretaker" ? values.area : undefined,
      };

      const updatedUser = await updateProfile(payload);
      toast.success("Profile complete! Welcome to Rommie.");
      goAfter(updatedUser, redirect);
    } catch (err) {
      if (err instanceof AuthError && err.field) {
        form.setError(err.field, { message: err.message });
      } else {
        toast.error(err.message || "Failed to update profile. Please try again.");
      }
    }
  });

  return (
    <AuthShell
      title="Complete your profile"
      subtitle="A few quick details to personalize your experience on Rommie."
    >
      {/* Verified Google Account Banner */}
      {user?.email && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-bebe/80 bg-faint p-3 text-xs text-foggy">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-vacant" />
          <div className="min-w-0 flex-1 truncate">
            <span className="font-medium text-hof">{user.email}</span>
            <span className="ml-1.5 text-foggy">· Verified by Google</span>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {/* Full Name */}
        <Field label="Full name" error={errors.name?.message} required>
          {(props) => (
            <TextInput
              {...props}
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              {...form.register("name")}
            />
          )}
        </Field>

        {/* Role Toggle Selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-hof">
            I am using Rommie as a: <span className="text-rausch">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRoleChange("student")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                selectedRole === "student"
                  ? "border-hof bg-surface shadow-xs font-semibold text-hof ring-1 ring-hof"
                  : "border-bebe bg-card text-foggy hover:border-deco hover:text-hof"
              }`}
            >
              <GraduationCap className={`h-6 w-6 ${selectedRole === "student" ? "text-hof" : "text-foggy"}`} />
              <div className="text-xs">
                <div className="font-medium text-sm">Student</div>
                <div className="text-[11px] opacity-80">Looking for accommodation</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("caretaker")}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                selectedRole === "caretaker"
                  ? "border-hof bg-surface shadow-xs font-semibold text-hof ring-1 ring-hof"
                  : "border-bebe bg-card text-foggy hover:border-deco hover:text-hof"
              }`}
            >
              <Building2 className={`h-6 w-6 ${selectedRole === "caretaker" ? "text-hof" : "text-foggy"}`} />
              <div className="text-xs">
                <div className="font-medium text-sm">Caretaker / Landlord</div>
                <div className="text-[11px] opacity-80">Listing student rooms</div>
              </div>
            </button>
          </div>
        </div>

        {/* Phone Number */}
        <Field
          label="Phone number (WhatsApp & Calls)"
          error={errors.phone?.message}
          hint="Caretakers and students connect directly via WhatsApp and phone calls."
          required
        >
          {(props) => (
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foggy" />
              <TextInput
                {...props}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0712 345 678"
                className="pl-9"
                {...form.register("phone")}
              />
            </div>
          )}
        </Field>

        {/* University / Campus (For Students) */}
        {selectedRole === "student" && (
          <div className="space-y-3 rounded-xl border border-bebe/60 bg-surface/50 p-4">
            <Field label="Your University / Campus" error={errors.school?.message} required>
              {() => (
                <div className="relative">
                  <select
                    value={selectedSchool}
                    onChange={handleSchoolChange}
                    className="h-10 w-full rounded-md border border-bebe bg-card px-3 text-sm text-hof shadow-xs transition-colors focus:border-hof focus:outline-none"
                  >
                    {CAMPUSES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.short})
                      </option>
                    ))}
                    <option value="Other">Other University / College</option>
                  </select>
                </div>
              )}
            </Field>

            {selectedSchool === "Other" && (
              <Field label="Institution name" error={errors.customSchool?.message} required>
                {(props) => (
                  <TextInput
                    {...props}
                    type="text"
                    placeholder="e.g. Riara University, Multimedia University"
                    {...form.register("customSchool")}
                  />
                )}
              </Field>
            )}

            <p className="text-[11px] text-foggy">
              We calculate walking and matatu transit times from your campus to listings.
            </p>
          </div>
        )}

        {/* Primary Area (For Caretakers) */}
        {selectedRole === "caretaker" && (
          <div className="space-y-3 rounded-xl border border-bebe/60 bg-surface/50 p-4">
            <Field label="Primary Location / Area" error={errors.area?.message}>
              {() => (
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foggy" />
                  <select
                    {...form.register("area")}
                    className="h-10 w-full rounded-md border border-bebe bg-card pl-9 pr-3 text-sm text-hof shadow-xs transition-colors focus:border-hof focus:outline-none"
                  >
                    <option value="Karen">Karen</option>
                    <option value="Rongai">Rongai</option>
                    <option value="Gataka">Gataka</option>
                    <option value="Maasai Lodge">Maasai Lodge</option>
                    <option value="Other">Other nearby area</option>
                  </select>
                </div>
              )}
            </Field>
            <p className="text-[11px] text-foggy">
              You can post rooms in any area once your profile is set up.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Profile...
            </>
          ) : (
            "Complete Profile & Continue"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
