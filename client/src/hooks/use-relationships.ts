import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertTaskRelationship, InsertTaskDiscussionLink } from "@shared/schema";

export function useTaskRelationships(taskId: number | undefined) {
  return useQuery({
    queryKey: [api.taskRelationships.list.path, taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const url = new URL(api.taskRelationships.list.path, window.location.origin);
      url.searchParams.append('taskId', String(taskId));
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch task relationships");
      return api.taskRelationships.list.responses[200].parse(await res.json());
    },
    enabled: !!taskId,
  });
}

export function useCreateTaskRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTaskRelationship) => {
      const res = await fetch(api.taskRelationships.create.path, {
        method: api.taskRelationships.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to create relationship");
      return api.taskRelationships.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.taskRelationships.list.path] });
    },
  });
}

export function useDeleteTaskRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.taskRelationships.delete.path, { id });
      const res = await fetch(url, {
        method: api.taskRelationships.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete relationship");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.taskRelationships.list.path] });
    },
  });
}

export function useTaskDiscussionLinks(taskId?: number, discussionItemId?: number) {
  return useQuery({
    queryKey: [api.taskDiscussionLinks.list.path, taskId, discussionItemId],
    queryFn: async () => {
      const url = new URL(api.taskDiscussionLinks.list.path, window.location.origin);
      if (taskId) url.searchParams.append('taskId', String(taskId));
      if (discussionItemId) url.searchParams.append('discussionItemId', String(discussionItemId));
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch task-discussion links");
      return api.taskDiscussionLinks.list.responses[200].parse(await res.json());
    },
    enabled: !!taskId || !!discussionItemId,
  });
}

export function useCreateTaskDiscussionLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTaskDiscussionLink) => {
      const res = await fetch(api.taskDiscussionLinks.create.path, {
        method: api.taskDiscussionLinks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to create link");
      return api.taskDiscussionLinks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.taskDiscussionLinks.list.path] });
    },
  });
}

export function useDeleteTaskDiscussionLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.taskDiscussionLinks.delete.path, { id });
      const res = await fetch(url, {
        method: api.taskDiscussionLinks.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete link");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.taskDiscussionLinks.list.path] });
    },
  });
}
