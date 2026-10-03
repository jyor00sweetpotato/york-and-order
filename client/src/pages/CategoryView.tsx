import { useRoute } from "wouter";
import { useTodos } from "@/hooks/use-todos";
import { CreateTodoDialog } from "@/components/CreateTodoDialog";
import { TodoCard } from "@/components/TodoCard";
import { Briefcase, User, Loader2, Zap, Calendar, CalendarDays, CalendarRange, Clock, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categoryConfig: Record<string, { icon: any; color: string; bgColor: string; description: string }> = {
  "ASAP": { icon: Zap, color: "text-red-600", bgColor: "bg-red-100", description: "Urgent tasks that need immediate attention." },
  "Today": { icon: Calendar, color: "text-orange-600", bgColor: "bg-orange-100", description: "Tasks to complete by end of day." },
  "This Week": { icon: CalendarDays, color: "text-yellow-600", bgColor: "bg-yellow-100", description: "Tasks due within the current week." },
  "Next Week": { icon: CalendarRange, color: "text-blue-600", bgColor: "bg-blue-100", description: "Plan ahead for next week." },
  "Eventually": { icon: Clock, color: "text-purple-600", bgColor: "bg-purple-100", description: "Low priority tasks with no rush." },
  "Parking Lot": { icon: Inbox, color: "text-gray-600", bgColor: "bg-gray-100", description: "Ideas and tasks to revisit later." },
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
            <div className={`p-3 rounded-2xl ${isProfessional ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
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
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isProfessional ? 'bg-blue-50' : 'bg-purple-50'}`}>
                <Icon className={`w-8 h-8 ${isProfessional ? 'text-blue-500' : 'text-purple-500'}`} />
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
