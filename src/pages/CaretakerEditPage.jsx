import { useParams } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Link, useNavigate } from "@/lib/router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RoomForm } from "@/components/caretaker/RoomForm";
import { Button } from "@/components/ui/button";
import { RequireRole, useAuth } from "@/lib/auth";
import { getRoom, updateListing } from "@/services/api";
const PAGE_META = [{ title: "Edit room · Rommie" }, { name: "robots", content: "noindex" }];

export default function CaretakerEditPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["caretaker"]} loginPath="/caretaker/login">
      <EditRoom />
    </RequireRole>);
}
function EditRoom() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ["room", id], queryFn: () => getRoom(id) });
    if (q.isLoading)
        return <div className="page-container max-w-[760px] py-10"><div className="h-96 animate-pulse rounded-xl bg-deco"/></div>;
    if (q.isError) {
        return (<div className="page-container py-20 text-center">
        <h1 className="text-page">Couldn't load this room</h1>
        <Button className="mt-6" onClick={() => void q.refetch()}>Retry</Button>
      </div>);
    }
    const room = q.data;
    if (!room || !user || room.caretakerId !== user.id) {
        return (<div className="page-container py-20 text-center">
        <h1 className="text-page">Room not found</h1>
        <p className="mt-2 text-foggy">It may have been removed, or it belongs to another account.</p>
        <Button asChild className="mt-6"><Link to="/caretaker/listings">Back to my listings</Link></Button>
      </div>);
    }
    const submit = async (data) => {
        await updateListing(id, data);
        await Promise.all([
            qc.invalidateQueries({ queryKey: ["my-listings"] }),
            qc.invalidateQueries({ queryKey: ["room", id] }),
            qc.invalidateQueries({ queryKey: ["rooms"] }),
        ]);
        toast.success("Changes saved");
        await navigate({ to: "/caretaker/listings" });
    };
    return (<div className="page-container max-w-[760px] py-6 md:py-10">
      <h1 className="text-page">Edit room</h1>
      <p className="mt-2 mb-6 text-foggy">{room.title}</p>
      <RoomForm initial={room} accountPhone={user.phone} submitLabel="Save changes" onSubmit={submit}/>
    </div>);
}
