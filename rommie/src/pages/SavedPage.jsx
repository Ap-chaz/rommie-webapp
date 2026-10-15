import { usePageMeta } from "@/lib/usePageMeta";
import { Link } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { RoomCard, RoomCardSkeleton } from "@/components/RoomCard";
import { ErrorCard, StateCard } from "@/components/StateCard";
import { Button } from "@/components/ui/button";
import { RequireRole, useAuth } from "@/lib/auth";
import { useSaved } from "@/lib/saved";
import { getSavedRooms } from "@/services/api";
const PAGE_META = [{ title: "Saved Rooms · Rommie" }, { name: "robots", content: "noindex" }];

export default function SavedPage() {
  usePageMeta(PAGE_META);
  return (<RequireRole roles={["student"]}>
      <Saved />
    </RequireRole>);
}
function Saved() {
    const { user } = useAuth();
    const { remove } = useSaved();
    const q = useQuery({ queryKey: ["saved-rooms", user?.id], queryFn: getSavedRooms, enabled: !!user });
    return (<div className="page-container py-6 md:py-10">
      <h1 className="text-page">Saved rooms</h1>
      <p className="mt-1 text-foggy">Rooms you've hearted, newest first. Taken rooms stay here so you can compare.</p>

      <div className="mt-8">
        {q.isError ? (<ErrorCard title="We couldn't load your saved rooms" onRetry={() => void q.refetch()}/>) : q.isLoading || !q.data ? (<Grid>{Array.from({ length: 4 }).map((_, i) => <RoomCardSkeleton key={i}/>)}</Grid>) : q.data.length === 0 ? (<StateCard title="No saved rooms yet." text="Tap the heart on any room to keep it here.">
            <Button asChild><Link to="/rooms">Browse rooms</Link></Button>
          </StateCard>) : (<Grid>
            {q.data.map((room) => (<div key={room.id}>
                <RoomCard room={room}/>
                <Button variant="outline" className="mt-3 w-full" onClick={() => remove(room.id)}>Remove</Button>
              </div>))}
          </Grid>)}
      </div>
    </div>);
}
function Grid({ children }) {
    return <div className="grid grid-cols-1 gap-x-3 gap-y-8 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
