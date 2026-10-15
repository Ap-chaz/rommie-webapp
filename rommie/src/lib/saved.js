import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth, useAuthGate } from "@/lib/auth";
import { getSavedIds, saveRoom, unsaveRoom } from "@/services/api";
/**
 * Saved-room state for hearts and Save buttons. Visitors are asked to log in; caretakers and admins are told
 * saving is a student feature. Updates are optimistic and roll back if the call fails.
 */
export function useSaved() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const gate = useAuthGate();
    const key = ["saved-ids", user?.id ?? "visitor"];
    const q = useQuery({ queryKey: key, queryFn: getSavedIds, enabled: !!user && user.role === "student" });
    const ids = q.data ?? [];
    const mutation = useMutation({
        mutationFn: ({ id, save }) => (save ? saveRoom(id) : unsaveRoom(id)),
        onMutate: async ({ id, save }) => {
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData(key) ?? [];
            qc.setQueryData(key, save ? [id, ...prev.filter((x) => x !== id)] : prev.filter((x) => x !== id));
            return { prev };
        },
        onError: (_e, _v, ctx) => {
            qc.setQueryData(key, ctx?.prev ?? []);
            toast.error("Couldn't update your saved rooms. Try again.");
        },
        onSettled: () => {
            void qc.invalidateQueries({ queryKey: key });
            void qc.invalidateQueries({ queryKey: ["saved-rooms"] });
        },
    });
    const toggle = (id) => gate("Log in to save rooms.", (u) => {
        if (u.role !== "student") {
            toast("Saving rooms is for student accounts.");
            return;
        }
        const save = !ids.includes(id);
        mutation.mutate({ id, save });
        toast(save ? "Saved to your rooms" : "Removed from saved rooms");
    });
    /** Explicit unsave, for "Remove" buttons that must not depend on the id list having loaded. */
    const remove = (id) => {
        mutation.mutate({ id, save: false });
        toast("Removed from saved rooms");
    };
    return { isSaved: (id) => ids.includes(id), toggle, remove };
}
