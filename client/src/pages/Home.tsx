import { useState, useMemo } from "react";
import { useTodos, useTasksNeedingReview } from "@/hooks/use-todos";
import { useTodoCategories, useTodoTypes } from "@/hooks/use-settings";
import { CreateTodoDialog } from "@/components/CreateTodoDialog";
import { TodoCard } from "@/components/TodoCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ClipboardList, AlertCircle, AlertTriangle, RefreshCw, Search, Filter, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { checkTaskNeedsReview } from "@shared/deadline-validation";
import type { Todo } from "@shared/schema";

const URGENCY_ORDER: Record<string, number> = {
  "ASAP": 1,
  "Today": 2,
  "This Week": 3,
  "Next Week": 4,
  "Eventually": 5,
  "Parking Lot": 6,
};

export default function Home() {
  const { data: todos, isLoading, error } = useTodos({ status: 'pending' });
  const { data: tasksNeedingReview } = useTasksNeedingReview();
  const { data: categories } = useTodoCategories();
  const { data: types } = useTodoTypes();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("urgency-asc");
  
  const taskReviewIds = new Set(tasksNeedingReview?.map(t => t.id) || []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const sortTasks = (tasks: Todo[]): Todo[] => {
    return [...tasks].sort((a, b) => {
      if (sortOrder === "urgency-asc") {
        return (URGENCY_ORDER[a.category] || 99) - (URGENCY_ORDER[b.category] || 99);
      } else if (sortOrder === "urgency-desc") {
        return (URGENCY_ORDER[b.category] || 99) - (URGENCY_ORDER[a.category] || 99);
      } else if (sortOrder === "deadline-asc") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      } else if (sortOrder === "deadline-desc") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
      } else if (sortOrder === "title-asc") {
        return a.title.localeCompare(b.title);
      } else if (sortOrder === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });
  };

  const filterTasks = (tasks: Todo[]): Todo[] => {
    return tasks.filter(todo => {
      const matchesSearch = searchQuery === "" || 
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === "all" || todo.category === filterCategory;
      const matchesType = filterType === "all" || todo.type === filterType;
      return matchesSearch && matchesCategory && matchesType;
    });
  };

  const now = new Date();

  const filteredTodos = useMemo(() => {
    if (!todos) return [];
    return filterTasks(todos);
  }, [todos, searchQuery, filterCategory, filterType]);

  const overdueTodos = useMemo(() => {
    return sortTasks(filteredTodos.filter(todo => 
      todo.deadline && new Date(todo.deadline) < now && !todo.isCompleted && !taskReviewIds.has(todo.id)
    ));
  }, [filteredTodos, taskReviewIds, sortOrder]);

  const upcomingTodos = useMemo(() => {
    return sortTasks(filteredTodos.filter(todo => 
      (!todo.deadline || new Date(todo.deadline) >= now) && !taskReviewIds.has(todo.id)
    ));
  }, [filteredTodos, taskReviewIds, sortOrder]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">
            {greeting()}, let's get things done.
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">
            {format(new Date(), "EEEE, MMMM do")}
          </p>
        </div>
        <CreateTodoDialog />
      </header>

      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-search-tasks"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger data-testid="select-filter-category" className="w-[140px] rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger data-testid="select-filter-type" className="w-[140px] rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types?.map((type) => (
                <SelectItem key={type.id} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger data-testid="select-sort-order" className="w-[160px] rounded-xl">
              <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgency-asc">Urgency (High first)</SelectItem>
              <SelectItem value="urgency-desc">Urgency (Low first)</SelectItem>
              <SelectItem value="deadline-asc">Deadline (Soon first)</SelectItem>
              <SelectItem value="deadline-desc">Deadline (Later first)</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading tasks</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : todos?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border border-dashed border-border text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold font-display text-foreground">All caught up!</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            You have no pending tasks. Take a break or create a new one to get started.
          </p>
        </div>
      ) : filteredTodos.length === 0 && (searchQuery || filterCategory !== "all" || filterType !== "all") ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border border-dashed border-border text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold font-display text-foreground">No matching tasks</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            No tasks match your current filters. Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          {tasksNeedingReview && tasksNeedingReview.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2" data-testid="section-tasks-to-review">
                <RefreshCw className="w-4 h-4" />
                Tasks To Review ({tasksNeedingReview.length})
              </h3>
              <p className="text-sm text-muted-foreground -mt-2" data-testid="text-tasks-review-description">
                These tasks have deadlines that no longer match their priority. Click to update them.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {tasksNeedingReview.map((todo) => (
                    <TodoCard key={todo.id} todo={todo} needsReview />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {overdueTodos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue Tasks ({overdueTodos.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {overdueTodos.map((todo) => (
                    <TodoCard key={todo.id} todo={todo} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {upcomingTodos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                {overdueTodos.length > 0 ? 'Other Tasks' : 'Pending Tasks'} ({upcomingTodos.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {upcomingTodos.map((todo) => (
                    <TodoCard key={todo.id} todo={todo} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
