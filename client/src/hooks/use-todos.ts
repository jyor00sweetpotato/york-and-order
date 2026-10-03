import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertTodo, Todo } from "@shared/schema";
import { checkTaskNeedsReview } from "@shared/deadline-validation";

type TodoFilters = {
  status?: 'pending' | 'completed';
  type?: 'personal' | 'professional';
  category?: 'ASAP' | 'Today' | 'This Week' | 'Next Week' | 'Eventually' | 'Parking Lot';
};

export function useTodos(filters?: TodoFilters) {
  const queryKey = [api.todos.list.path, filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.todos.list.path, window.location.origin);
      if (filters?.status) url.searchParams.append('status', filters.status);
      if (filters?.type) url.searchParams.append('type', filters.type);
      if (filters?.category) url.searchParams.append('category', filters.category);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch todos");
      return api.todos.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTodo) => {
      const validated = api.todos.create.input.parse(data);
      const res = await fetch(api.todos.create.path, {
        method: api.todos.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.todos.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create todo");
      }
      return api.todos.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.todos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertTodo>) => {
      const validated = api.todos.update.input.parse(updates);
      const url = buildUrl(api.todos.update.path, { id });
      
      const res = await fetch(url, {
        method: api.todos.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Todo not found");
        throw new Error("Failed to update todo");
      }
      return api.todos.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.todos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.todos.delete.path, { id });
      const res = await fetch(url, { 
        method: api.todos.delete.method,
        credentials: "include" 
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Todo not found");
        throw new Error("Failed to delete todo");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.todos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

export function useTodoStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.get.responses[200].parse(await res.json());
    },
  });
}

export function useTasksNeedingReview() {
  const { data: todos, ...rest } = useTodos({ status: 'pending' });
  
  const tasksNeedingReview = (todos || []).filter((todo: Todo) => 
    checkTaskNeedsReview(todo.deadline ? new Date(todo.deadline) : null, todo.category)
  );
  
  return {
    ...rest,
    data: tasksNeedingReview,
  };
}
