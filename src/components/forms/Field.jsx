import { forwardRef, useId, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
export const controlClass = "block h-12 w-full rounded-[8px] border border-deco bg-card px-3 text-base text-hof placeholder:text-grey-500 focus-visible:border-hof focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hof disabled:cursor-not-allowed disabled:bg-faint disabled:text-grey-500 aria-[invalid=true]:border-hof aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-hof";
/** Label + control + inline error. Errors use text and an icon, never a new color. */
export function Field({ label, error, hint, required, optional, className, children }) {
    const id = useId();
    const msgId = `${id}-msg`;
    return (<div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && <span aria-hidden className="ml-0.5">*</span>}
        {optional && <span className="ml-1 font-normal text-foggy">(optional)</span>}
      </label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error || hint ? msgId : undefined })}
      {error ? (<p id={msgId} role="alert" className="flex items-start gap-1.5 text-sm font-medium">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden/> {error}
        </p>) : hint ? (<p id={msgId} className="text-sm text-foggy">{hint}</p>) : null}
    </div>);
}
export const TextInput = forwardRef(({ className, ...p }, ref) => (<input ref={ref} className={cn(controlClass, className)} {...p}/>));
TextInput.displayName = "TextInput";
export const SelectInput = forwardRef(({ className, children, ...p }, ref) => (<select ref={ref} className={cn(controlClass, "appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23222' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...p}>
    {children}
  </select>));
SelectInput.displayName = "SelectInput";
/** Password box with a show/hide button. The button is a real button, so keyboard and screen readers get it too. */
export const PasswordInput = forwardRef(({ className, ...p }, ref) => {
    const [show, setShow] = useState(false);
    return (<div className="relative">
      <input ref={ref} type={show ? "text" : "password"} className={cn(controlClass, "pr-12", className)} {...p}/>
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[8px] text-foggy hover:text-hof focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hof">
        {show ? <EyeOff className="h-5 w-5" strokeWidth={1.75} aria-hidden/> : <Eye className="h-5 w-5" strokeWidth={1.75} aria-hidden/>}
      </button>
    </div>);
});
PasswordInput.displayName = "PasswordInput";
