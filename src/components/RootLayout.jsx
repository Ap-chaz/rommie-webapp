import { useEffect, useState } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Toaster } from "@/components/ui/sonner";

/** True while the bottom tab bar is showing (< 1024px), so toasts can sit above it. */
function useTabBarVisible() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(width < 1024px)");
    const update = () => setOn(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return on;
}

/** App shell wrapped around every page. */
export function RootLayout() {
  const tabBar = useTabBarVisible();
  return (
    <>
      <SiteHeader />
      <OfflineBanner />
      <main className="min-h-dvh pt-[calc(var(--header-h)+env(safe-area-inset-top))] pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] lg:pb-0">
        <Outlet />
      </main>
      <SiteFooter />
      <Toaster position="bottom-center" offset={tabBar ? { bottom: 88 } : 24} mobileOffset={{ bottom: 88 }} />
      <ScrollRestoration />
    </>
  );
}
