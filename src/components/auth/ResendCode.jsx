import { useCountdown } from "@/lib/useCountdown";
export function useResend(seconds = 30) {
    return useCountdown(seconds);
}
export function ResendCode({ left, onResend, disabled }) {
    return left > 0 ? (<p className="text-foggy" aria-live="polite">Resend code in 0:{String(left).padStart(2, "0")}</p>) : (<button type="button" onClick={onResend} disabled={disabled} className="min-h-11 font-medium underline disabled:opacity-50">
      Resend code
    </button>);
}
