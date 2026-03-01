import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useDiaryEntries() {
  return useQuery({
    queryKey: ['/api/diary'],
    queryFn: async () => {
      const res = await fetch('/api/diary', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch diary entries");
      return res.json();
    },
  });
}

export function useDiaryEntry(id: number | null) {
  return useQuery({
    queryKey: ['/api/diary', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/diary/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch entry");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateDiaryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title?: string; body: string; mood?: string; tags?: string[]; photoUrls?: string[]; isPrivate?: boolean }) => {
      const res = await apiRequest("POST", '/api/diary', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diary/mood-stats'] });
    },
  });
}

export function useUpdateDiaryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; title?: string | null; body?: string; mood?: string | null; tags?: string[] | null; photoUrls?: string[] | null; isPrivate?: boolean; sharedWith?: string[] | null }) => {
      const res = await apiRequest("PATCH", `/api/diary/${id}`, data);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/diary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diary', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/diary/mood-stats'] });
    },
  });
}

export function useDeleteDiaryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/diary/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diary/deleted'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diary/mood-stats'] });
    },
  });
}

export function useDeletedDiaryEntries() {
  return useQuery({
    queryKey: ['/api/diary/deleted'],
    queryFn: async () => {
      const res = await fetch('/api/diary/deleted', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch deleted entries");
      return res.json();
    },
  });
}

export function useRestoreDiaryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/diary/${id}/restore`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diary/deleted'] });
      queryClient.invalidateQueries({ queryKey: ['/api/diary/mood-stats'] });
    },
  });
}

export function useMoodStats() {
  return useQuery({
    queryKey: ['/api/diary/mood-stats'],
    queryFn: async () => {
      const res = await fetch('/api/diary/mood-stats', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch mood stats");
      return res.json();
    },
  });
}

export function useDiarySettings() {
  return useQuery({
    queryKey: ['/api/diary/settings'],
    queryFn: async () => {
      const res = await fetch('/api/diary/settings', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch diary settings");
      return res.json();
    },
  });
}

export function useUpdateDiarySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { diaryPin?: string; isLocked?: boolean; weeklyReflectionEnabled?: boolean }) => {
      const res = await apiRequest("PATCH", '/api/diary/settings', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diary/settings'] });
    },
  });
}

export function useVerifyDiaryPin() {
  return useMutation({
    mutationFn: async (pin: string) => {
      const res = await apiRequest("POST", '/api/diary/verify-pin', { pin });
      return res.json();
    },
  });
}
