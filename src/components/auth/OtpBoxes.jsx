import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
const slot = "h-12 min-w-0 flex-1 rounded-[8px] border border-deco bg-card text-xl font-medium shadow-none first:rounded-[8px] first:border last:rounded-[8px] sm:h-14 data-[invalid=true]:border-hof";
export function OtpBoxes({ value, onChange, onComplete, disabled, invalid, autoFocus }) {
    return (<InputOTP maxLength={6} value={value} onChange={onChange} {...(onComplete ? { onComplete } : {})} {...(disabled !== undefined ? { disabled } : {})} {...(autoFocus !== undefined ? { autoFocus } : {})} inputMode="numeric" pattern="^[0-9]*$" aria-label="6-digit code" containerClassName="justify-center gap-2">
      <InputOTPGroup className="w-full max-w-[19rem] gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (<InputOTPSlot key={i} index={i} data-invalid={invalid ? "true" : undefined} className={slot}/>))}
      </InputOTPGroup>
    </InputOTP>);
}
