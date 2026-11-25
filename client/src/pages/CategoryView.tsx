import { useRoute } from "wouter";
import { useTodos } from "@/hooks/use-todos";
import { CreateTodoDialog } from "@/components/CreateTodoDialog";
import { TodoCard } from "@/components/TodoCard";
import { Briefcase, User, Loader2, Zap, Calendar, CalendarDays, CalendarRange, Clock, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categoryConfig: Record<string, { icon: any; color: string; bgColor: string; description: string }> = {
  "ASAP": { icon: Zap, color: "text-walden-rust", bgColor: "bg-walden-rust-wash", description: "Urgent tasks that need immediate attention." },
  "Today": { icon: Calendar, color: "text-walden-ink", bgColor: "bg-walden-sun", description: "Tasks to complete by end of day." },
  "This Week": { icon: CalendarDays, color: "text-walden-ink", bgColor: "bg-walden-sun-wash", description: "Tasks due within the current week." },
  "Next Week": { icon: CalendarRange, color: "text-walden-ink", bgColor: "bg-walden-line", description: "Plan ahead for next week." },
  "Eventually": { icon: Clock, color: "text-walden-grey-700", bgColor: "bg-walden-grey-100", description: "Low priority tasks with no rush." },
  "Parking Lot": { icon: Inbox, color: "text-walden-grey-700", bgColor: "bg-walden-grey-100", description: "Ideas and tasks to revisit later." },
};

export default function CategoryView() {
  const [matchCategory, categoryParams] = useRoute("/category/:category");
  const [matchType, typeParams] = useRoute("/type/:type");
  
  const category = categoryParams?.category as string | undefined;
  const type = typeParams?.type as 'personal' | 'professional' | undefined;

  const { data: todos, isLoading } = useTodos({ 
    category: matchCategory ? category as any : undefined,
    type: matchType ? type : undefined,
    status: 'pending' 
  });

  if (matchCategory && category) {
    const config = categoryConfig[category];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${config.bgColor} ${config.color}`}>
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground">
                {category}
              </h2>
              <p className="text-muted-foreground mt-1 text-lg max-w-xl">
                {config.description}
              </p>
            </div>
          </div>
          <CreateTodoDialog />
        </header>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : todos?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border border-dashed border-border text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${config.bgColor}`}>
                <Icon className={`w-8 h-8 ${config.color}`} />
              </div>
              <h3 className="text-xl font-bold font-display text-foreground">No tasks here</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                You don't have any pending {category} tasks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

  if (matchType && type) {
    const isProfessional = type === 'professional';
    const Icon = isProfessional ? Briefcase : User;
    const title = isProfessional ? "Professional Tasks" : "Personal Tasks";
    const subtitle = isProfessional 
      ? "Manage work projects, meetings, and career goals." 
      : "Track personal goals, errands, and life admin.";

    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${isProfessional ? 'bg-walden-line text-walden-ink' : 'bg-walden-grey-100 text-walden-grey-700'}`}>
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground capitalize">
                {title}
              </h2>
              <p className="text-muted-foreground mt-1 text-lg max-w-xl">
                {subtitle}
              </p>
            </div>
          </div>
          <CreateTodoDialog />
        </header>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : todos?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card/50 rounded-3xl border border-dashed border-border text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isProfessional ? 'bg-walden-grey-100' : 'bg-walden-paper'}`}>
                <Icon className={`w-8 h-8 ${isProfessional ? 'text-walden-ink' : 'text-walden-grey-700'}`} />
              </div>
              <h3 className="text-xl font-bold font-display text-foreground">No tasks here</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                You don't have any pending {type} tasks. Great job!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

  return null;
}
