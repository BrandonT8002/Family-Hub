import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

export function useFamily() {
  return useQuery({
    queryKey: [api.family.get.path],
    queryFn: async () => {
      const res = await fetch(api.family.get.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch family");
      return api.family.get.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", api.family.create.path, data);
      return api.family.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.family.get.path] });
    },
  });
}
