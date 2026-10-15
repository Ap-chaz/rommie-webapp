import { Link } from "@/lib/router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { homeFor, useAuth } from "@/lib/auth";
import { logout } from "@/services/api";
/**
 * Shown on caretaker sign up / log in when someone is already signed in as a student or admin.
 * Without it, the page would silently bounce them back to where they came from.
 */
export function WrongRoleNotice({ action }) {
    const { user } = useAuth();
    if (!user)
        return null;
    return (<div className="page-container max-w-[520px] py-16 text-center">
      <h1 className="text-page">Listing rooms needs a caretaker account</h1>
      <p className="mt-3 text-foggy">
        You're signed in as a {user.role}. To {action} as a caretaker, log out first.
        {user.role === "student" && " If you want to list a room, sign up as a caretaker with a different phone number from your student account."}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" onClick={async () => { await logout(); toast("Logged out"); }}>Log out and {action} as a caretaker</Button>
        <Button asChild size="lg" variant="outline"><Link to={homeFor(user.role)}>Stay signed in</Link></Button>
      </div>
    </div>);
}
