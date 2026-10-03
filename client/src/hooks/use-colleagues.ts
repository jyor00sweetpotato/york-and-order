import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertColleague, InsertDiscussionItem } from "@shared/schema";

export function useColleagues() {
  return useQuery({
    queryKey: [api.colleagues.list.path],
    queryFn: async () => {
      const res = await fetch(api.colleagues.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch colleagues");
      return api.colleagues.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateColleague() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertColleague) => {
      const res = await fetch(api.colleagues.create.path, {
        method: api.colleagues.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create colleague");
      return api.colleagues.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.colleagues.list.path] });
    },
  });
}

export function useDeleteColleague() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.colleagues.delete.path, { id });
      const res = await fetch(url, { method: api.colleagues.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete colleague");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.colleagues.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.discussionItems.list.path] });
    },
  });
}

type DiscussionFilters = {
  colleagueId?: number;
  status?: string;
  archived?: boolean;
};

export function useDiscussionItems(filters?: DiscussionFilters) {
  const queryKey = [api.discussionItems.list.path, filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.discussionItems.list.path, window.location.origin);
      if (filters?.colleagueId) url.searchParams.append('colleagueId', String(filters.colleagueId));
      if (filters?.status) url.searchParams.append('status', filters.status);
      if (filters?.archived !== undefined) url.searchParams.append('archived', String(filters.archived));
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch discussion items");
      return api.discussionItems.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateDiscussionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertDiscussionItem) => {
      const res = await fetch(api.discussionItems.create.path, {
        method: api.discussionItems.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create discussion item");
      return api.discussionItems.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.discussionItems.list.path] });
    },
  });
}

export function useUpdateDiscussionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertDiscussionItem>) => {
      const url = buildUrl(api.discussionItems.update.path, { id });
      const res = await fetch(url, {
        method: api.discussionItems.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update discussion item");
      return api.discussionItems.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.discussionItems.list.path] });
    },
  });
}

export function useDeleteDiscussionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.discussionItems.delete.path, { id });
      const res = await fetch(url, { method: api.discussionItems.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete discussion item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.discussionItems.list.path] });
    },
  });
}
