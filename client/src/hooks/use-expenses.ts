import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import type { Expense, FinancialSchedule, SavingsGoal } from "@shared/schema";

export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: [api.expenses.list.path],
    queryFn: async () => {
      const res = await fetch(api.expenses.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return await res.json();
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { amount: string | number; category: string; description: string; vendor?: string; date?: string; notes?: string; tag?: string }) => {
      const res = await apiRequest("POST", api.expenses.create.path, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
    },
  });
}

export function useFinancialSchedule() {
  return useQuery<FinancialSchedule[]>({
    queryKey: [api.financialSchedule.list.path],
    queryFn: async () => {
      const res = await fetch(api.financialSchedule.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch financial schedule");
      return await res.json();
    },
  });
}

export function useCreateFinancialSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; amount: string | number; type: string; frequency?: string; dueDate: string; isPayday?: boolean }) => {
      const res = await apiRequest("POST", api.financialSchedule.create.path, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.financialSchedule.list.path] });
    },
  });
}

export function useSavingsGoals() {
  return useQuery<SavingsGoal[]>({
    queryKey: [api.savingsGoals.list.path],
    queryFn: async () => {
      const res = await fetch(api.savingsGoals.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch savings goals");
      return await res.json();
    },
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; targetAmount: string | number; currentAmount?: string | number }) => {
      const res = await apiRequest("POST", api.savingsGoals.create.path, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.savingsGoals.list.path] });
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentAmount }: { id: number; currentAmount: string | number }) => {
      const res = await apiRequest("PATCH", `/api/savings-goals/${id}`, { currentAmount });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.savingsGoals.list.path] });
    },
  });
}
