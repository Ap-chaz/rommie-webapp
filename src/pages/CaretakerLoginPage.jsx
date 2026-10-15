import { useSearch } from "@/lib/router";
import { usePageMeta } from "@/lib/usePageMeta";
import { LoginForm } from "@/components/auth/LoginForm";
import { WrongRoleNotice } from "@/components/auth/WrongRoleNotice";
import { redirectSearch, useAuth } from "@/lib/auth";
const PAGE_META = [{ title: "Caretaker log in · Rommie" }, { name: "robots", content: "noindex" }];
export default function CaretakerLoginPage() {
    usePageMeta(PAGE_META);
    const { redirect } = useSearch(redirectSearch);
    const { user, ready } = useAuth();
    if (ready && user && user.role !== "caretaker")
        return <WrongRoleNotice action="log in"/>;
    return <LoginForm role="caretaker" redirect={redirect}/>;
}
