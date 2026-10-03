import { useTodos } from "@/hooks/use-todos";
import { TodoCard } from "@/components/TodoCard";
import { CheckSquare, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function CompletedView() {
  const { data: todos, isLoading } = useTodos({ status: 'completed' });

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 text-green-700 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground">
            Completed Tasks
          </h2>
        </div>
        <p className="text-muted-foreground text-lg">
          A history of your accomplishments.
        </p>
      </header>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : todos?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border border-dashed border-border text-center">
            <h3 className="text-xl font-bold font-display text-foreground">Nothing completed yet</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              Finish some tasks to see them appear here. You can do it!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80 hover:opacity-100 transition-opacity">
            <AnimatePresence>
              {todos?.map((todo) => (
                <TodoCard key={todo.id} todo={todo} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
