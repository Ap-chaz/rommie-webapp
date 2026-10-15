import { usePageMeta } from "@/lib/usePageMeta";
import { useNavigate } from "@/lib/router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RoomForm } from "@/components/caretaker/RoomForm";
import { RequireRole, useAuth } from "@/lib/auth";
import { createListing } from "@/services/api";
const PAGE_META = [{ title: "Post a Room · Rommie" }, { name: "robots", content: "noindex" }];

export default function CaretakerPostPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["caretaker"]} loginPath="/caretaker/login">
      <PostRoom />
    </RequireRole>);
}
function PostRoom() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const qc = useQueryClient();
    if (!user)
        return null;
    const submit = async (data) => {
        await createListing({ ...data, caretakerId: user.id, status: "Vacant", lastConfirmedVacantAt: new Date().toISOString() });
        await qc.invalidateQueries({ queryKey: ["my-listings"] });
        await qc.invalidateQueries({ queryKey: ["rooms"] });
        toast.success("Room posted. Students can see it now.");
        await navigate({ to: "/caretaker/listings" });
    };
    return (<div className="page-container max-w-[760px] py-6 md:py-10">
      <h1 className="text-page">Post a room</h1>
      <p className="mt-2 mb-6 text-foggy">Takes about two minutes. Rooms start as vacant and show today as the confirmed date.</p>
      <RoomForm accountPhone={user.phone} submitLabel="Post room" onSubmit={submit}/>
    </div>);
}
