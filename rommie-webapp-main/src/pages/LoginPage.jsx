import { useSearch } from "@/lib/router";
import { usePageMeta } from "@/lib/usePageMeta";
import { LoginForm } from "@/components/auth/LoginForm";
import { redirectSearch } from "@/lib/auth";
const PAGE_META = [{ title: "Log in · Rommie" }, { name: "robots", content: "noindex" }];
export default function LoginPage() {
    usePageMeta(PAGE_META);
    const { redirect } = useSearch(redirectSearch);
    return <LoginForm role="student" redirect={redirect}/>;
}
