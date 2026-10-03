import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertSetting } from "@shared/schema";

export function useSettings(group?: string) {
  const queryKey = group ? [api.settings.list.path, { group }] : [api.settings.list.path];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.settings.list.path, window.location.origin);
      if (group) url.searchParams.append('group', group);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return api.settings.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSetting) => {
      const res = await fetch(api.settings.create.path, {
        method: api.settings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create setting");
      return api.settings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.list.path] });
    },
  });
}

export function useDeleteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.settings.delete.path, { id });
      const res = await fetch(url, { method: api.settings.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete setting");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.list.path] });
    },
  });
}

export function useTodoCategories() {
  return useSettings('todo_category');
}

export function useTodoTypes() {
  return useSettings('todo_type');
}

export function useDiscussionStatuses() {
  return useSettings('discussion_status');
}
