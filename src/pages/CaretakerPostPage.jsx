import { usePageMeta } from "@/lib/usePageMeta";
import { Link, useNavigate, useSearch } from "@/lib/router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RoomForm } from "@/components/caretaker/RoomForm";
import { RequireRole, useAuth } from "@/lib/auth";
import { createListing, getMyListings, updateListing } from "@/services/api";
import { roomTypeLabel } from "@/lib/format";
const validateSearch = (s) => ({ copy: typeof s["copy"] === "string" ? s["copy"] : undefined });
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
    const { copy } = useSearch(validateSearch);
    const mine = useQuery({ queryKey: ["my-listings", user?.id], queryFn: () => getMyListings(user.id), enabled: !!user && !!copy });
    if (!user)
        return null;
    if (copy && mine.isLoading)
        return <div className="page-container max-w-[760px] py-10"><div className="h-40 animate-pulse rounded-xl bg-deco" aria-busy="true" aria-label="Loading"/></div>;
    // "Post another room type in this building": reuse the building-level details and ask only for what differs.
    const source = copy ? mine.data?.find((r) => r.id === copy) : undefined;
    const prefill = source ? {
        area: source.area, title: "", description: "", depositTerms: source.depositTerms, amenities: source.amenities,
        distances: source.distances, matatuFareKes: source.matatuFareKes, mapLink: source.mapLink,
        whatsappNumber: source.whatsappNumber, callNumber: source.callNumber, photos: [],
    } : undefined;
    const submit = async (data) => {
        const buildingId = source ? (source.buildingId ?? source.id) : undefined;
        if (source && !source.buildingId)
            await updateListing(source.id, { buildingId });
        await createListing({ ...data, ...(buildingId ? { buildingId } : {}), caretakerId: user.id, status: "Vacant", lastConfirmedVacantAt: new Date().toISOString() });
        await qc.invalidateQueries({ queryKey: ["my-listings"] });
        await qc.invalidateQueries({ queryKey: ["rooms"] });
        await qc.invalidateQueries({ queryKey: ["room"] });
        await qc.invalidateQueries({ queryKey: ["building"] });
        toast.success(source ? "Room added to the same building." : "Room posted. Students can see it now.");
        await navigate({ to: "/caretaker/listings" });
    };
    return (<div className="page-container max-w-[760px] py-6 md:py-10">
      <h1 className="text-page">{source ? "Add another room type" : "Post a room"}</h1>
      {source ? (<p className="mt-2 mb-6 text-foggy">
          Same building as <span className="font-medium text-hof">{source.title}</span> ({roomTypeLabel[source.roomType]}). We've copied the location, contacts and what's included. Choose the room type, set the price and add photos of this room type. Not the right building?{" "}
          <Link to="/caretaker/post" className="font-medium text-hof underline">Start a blank listing</Link>
        </p>) : (<p className="mt-2 mb-6 text-foggy">Takes about two minutes. Rooms start as vacant and show today as the confirmed date.</p>)}
      <RoomForm key={source?.id ?? "new"} initial={prefill} accountPhone={user.phone} submitLabel={source ? "Post this room type" : "Post room"} onSubmit={submit}/>
    </div>);
}
