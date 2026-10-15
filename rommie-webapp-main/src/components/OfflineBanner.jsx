import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
const subscribe = (cb) => {
    window.addEventListener("online", cb);
    window.addEventListener("offline", cb);
    return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
    };
};
/** Global banner shown under the header while the browser reports no connection. Always "online" on the server. */
export function OfflineBanner() {
    const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
    if (online)
        return null;
    return (<div role="status" className="fixed inset-x-0 top-[calc(var(--header-h)+env(safe-area-inset-top))] z-30 bg-hof px-4 py-2 text-center text-sm font-medium text-primary-foreground">
      <WifiOff className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden/> You're offline. Some things may not load until you're back online.
    </div>);
}
