import { useSearch } from "@/lib/router";
import { usePageMeta } from "@/lib/usePageMeta";
import { SignupForm } from "@/components/auth/SignupForm";
import { WrongRoleNotice } from "@/components/auth/WrongRoleNotice";
import { redirectSearch, useAuth } from "@/lib/auth";
const PAGE_META = [{ title: "Caretaker sign up · Rommie" }, { name: "robots", content: "noindex" }];
export default function CaretakerSignupPage() {
    usePageMeta(PAGE_META);
    const { redirect } = useSearch(redirectSearch);
    const { user, ready } = useAuth();
    if (ready && user && user.role !== "caretaker")
        return <WrongRoleNotice action="sign up"/>;
    return <SignupForm role="caretaker" redirect={redirect}/>;
}
