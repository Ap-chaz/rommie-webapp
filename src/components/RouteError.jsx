import { useRouteError } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/lib/usePageMeta";

/**
 * Shown when a page throws or fails to load (for example a stale chunk right after a new deploy).
 * A full reload is the right "try again" for both cases.
 */
export function RouteError({ standalone = false }) {
  const error = useRouteError();
  console.error(error);
  usePageMeta([{ title: "This page didn't load · Rommie" }]);

  return (
    <div className={standalone ? "mx-auto max-w-xl px-4 py-24 text-center" : "page-container py-20 text-center"}>
      <h1 className="text-page">This page didn't load</h1>
      <p className="mx-auto mt-3 max-w-md text-foggy">
        Something went wrong on our end. Check your connection and try again.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={() => window.location.reload()}>Try again</Button>
        <Button asChild size="lg" variant="outline"><a href="/">Go home</a></Button>
      </div>
    </div>
  );
}
