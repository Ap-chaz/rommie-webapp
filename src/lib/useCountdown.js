import { useCallback, useEffect, useState } from "react";
/** Counts down whole seconds from `start`; call `restart()` to run it again. */
export function useCountdown(start) {
    const [left, setLeft] = useState(start);
    useEffect(() => {
        if (left <= 0)
            return;
        const t = setTimeout(() => setLeft((n) => n - 1), 1000);
        return () => clearTimeout(t);
    }, [left]);
    const restart = useCallback(() => setLeft(start), [start]);
    return { left, restart };
}
