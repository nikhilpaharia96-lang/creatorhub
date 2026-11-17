import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "@/lib/api/wishlist-api";
import { useAuth } from "@/providers/auth-provider";

const WISHLIST_QUERY_KEY = ["wishlist"];

/**
 * Wishlist is server state (per Section 8 — React Query, not client
 * context), since it must persist across devices for a logged-in
 * user. Query is disabled entirely when logged out rather than
 * erroring, since wishlist has no meaning for an anonymous visitor.
 */
export function useWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: wishlistApi.list,
    enabled: Boolean(user),
  });

  const addMutation = useMutation({
    mutationFn: wishlistApi.add,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY }),
  });

  const removeMutation = useMutation({
    mutationFn: wishlistApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY }),
  });

  const isWishlisted = (productId: string) => items.some((item) => item.id === productId);

  return {
    items,
    isLoading,
    isWishlisted,
    add: addMutation.mutate,
    remove: removeMutation.mutate,
    isMutating: addMutation.isPending || removeMutation.isPending,
  };
}
