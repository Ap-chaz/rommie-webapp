import { useSearch } from "@/lib/router";
import { usePageMeta } from "@/lib/usePageMeta";
import { SignupForm } from "@/components/auth/SignupForm";
import { redirectSearch } from "@/lib/auth";
const PAGE_META = [{ title: "Sign up · Rommie" }, { name: "robots", content: "noindex" }];
export default function SignupPage() {
    usePageMeta(PAGE_META);
    const { redirect } = useSearch(redirectSearch);
    return <SignupForm role="student" redirect={redirect}/>;
}
