import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/lib/usePageMeta";

const PAGE_META = [{ title: "Page not found · Rommie" }, { name: "robots", content: "noindex" }];

export default function NotFoundPage() {
  usePageMeta(PAGE_META);
  return (
    <div className="page-container py-20 text-center">
      <p className="text-section text-foggy">404</p>
      <h1 className="text-page mt-2">We couldn't find that page</h1>
      <p className="mx-auto mt-3 max-w-md text-foggy">The link may be old, or the room may have been taken down. Let's get you back to looking for a room.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg"><Link to="/rooms">Find a room</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/">Go home</Link></Button>
      </div>
    </div>
  );
}
