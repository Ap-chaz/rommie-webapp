import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
export function ComingSoon({ title, text }) {
    return (<div className="page-container py-20 text-center">
      <h1 className="text-page">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-foggy">{text}</p>
      <Button asChild className="mt-6"><Link to="/rooms">Browse rooms</Link></Button>
    </div>);
}
