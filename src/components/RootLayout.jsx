import { Outlet, ScrollRestoration } from "react-router-dom";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Toaster } from "@/components/ui/sonner";

/** App shell wrapped around every page. */
export function RootLayout() {
  return (
    <>
      <SiteHeader />
      <OfflineBanner />
      <main className="min-h-dvh pt-[calc(var(--header-h)+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <Outlet />
      </main>
      <SiteFooter />
      <Toaster position="bottom-center" offset={24} mobileOffset={{ bottom: 88 }} />
      <ScrollRestoration />
    </>
  );
}
