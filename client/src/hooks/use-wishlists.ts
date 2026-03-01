import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Wishlist, WishlistItem } from "@shared/schema";

export function useWishlists() {
  return useQuery<Wishlist[]>({
    queryKey: ["/api/wishlists"],
  });
}

export function useWishlistItems(wishlistId: number | null) {
  return useQuery<WishlistItem[]>({
    queryKey: ["/api/wishlists", wishlistId, "items"],
    queryFn: async () => {
      const res = await fetch(`/api/wishlists/${wishlistId}/items`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
    enabled: !!wishlistId,
  });
}

export function useCreateWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/wishlists", data);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/wishlists"] }),
  });
}

export function useUpdateWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/wishlists/${id}`, data);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/wishlists"] }),
  });
}

export function useDeleteWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/wishlists/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/wishlists"] }),
  });
}

export function useCreateWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ wishlistId, ...data }: any) => {
      const res = await apiRequest("POST", `/api/wishlists/${wishlistId}/items`, data);
      return res.json();
    },
    onSuccess: (_d: any, vars: any) => qc.invalidateQueries({ queryKey: ["/api/wishlists", vars.wishlistId, "items"] }),
  });
}

export function useUpdateWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, wishlistId, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/wishlists/items/${id}`, data);
      return res.json();
    },
    onSuccess: (_d: any, vars: any) => qc.invalidateQueries({ queryKey: ["/api/wishlists", vars.wishlistId, "items"] }),
  });
}

export function useDeleteWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, wishlistId }: { id: number; wishlistId: number }) => {
      await apiRequest("DELETE", `/api/wishlists/items/${id}`);
      return { wishlistId };
    },
    onSuccess: (_d: any, vars: any) => qc.invalidateQueries({ queryKey: ["/api/wishlists", vars.wishlistId, "items"] }),
  });
}
