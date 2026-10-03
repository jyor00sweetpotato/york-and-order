import { useState } from "react";
import { format } from "date-fns";
import { type Todo } from "@shared/schema";
import { useUpdateTodo, useDeleteTodo, useTodos } from "@/hooks/use-todos";
import { useTaskRelationships, useTaskDiscussionLinks } from "@/hooks/use-relationships";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, Clock, Briefcase, User, Link2, ArrowRight, ArrowLeft, MessageSquare, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { TaskDetailDialog } from "./TaskDetailDialog";

const categoryColors: Record<string, { bg: string; text: string }> = {
  "ASAP": { bg: "bg-red-100", text: "text-red-700" },
  "Today": { bg: "bg-orange-100", text: "text-orange-700" },
  "This Week": { bg: "bg-yellow-100", text: "text-yellow-700" },
  "Next Week": { bg: "bg-blue-100", text: "text-blue-700" },
  "Eventually": { bg: "bg-purple-100", text: "text-purple-700" },
  "Parking Lot": { bg: "bg-gray-100", text: "text-gray-700" },
};

interface TodoCardProps {
  todo: Todo;
  needsReview?: boolean;
}

export function TodoCard({ todo, needsReview = false }: TodoCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const { data: allTodos } = useTodos();
  const { data: relationships } = useTaskRelationships(todo.id);
  const { data: discussionLinks } = useTaskDiscussionLinks(todo.id);

  const handleToggle = () => {
    updateTodo.mutate({
      id: todo.id,
      isCompleted: !todo.isCompleted,
    });
  };

  const isProfessional = todo.type === 'professional';
  const catColor = categoryColors[todo.category] || categoryColors["Today"];

  const getRelatedTaskName = (taskId: number) => {
    return allTodos?.find(t => t.id === taskId)?.title || `Task #${taskId}`;
  };

  const getRelationshipInfo = (rel: { sourceTaskId: number; targetTaskId: number; relationshipType: string }) => {
    const isSource = rel.sourceTaskId === todo.id;
    const relatedTaskId = isSource ? rel.targetTaskId : rel.sourceTaskId;
    const relatedTaskName = getRelatedTaskName(relatedTaskId);
    
    let label = "";
    let Icon = Link2;
    if (rel.relationshipType === 'blocks') {
      label = isSource ? "Blocks" : "Blocked by";
      Icon = isSource ? ArrowRight : ArrowLeft;
    } else if (rel.relationshipType === 'blocked_by') {
      label = isSource ? "Blocked by" : "Blocks";
      Icon = isSource ? ArrowLeft : ArrowRight;
    } else {
      label = "Related";
      Icon = Link2;
    }
    
    return { label, Icon, relatedTaskName };
  };

  const hasRelationships = (relationships && relationships.length > 0) || (discussionLinks && discussionLinks.length > 0);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="checkbox"]') || target.tagName === 'BUTTON') {
      return;
    }
    setDetailOpen(true);
  };

  return (
    <>
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      data-testid={`card-todo-${todo.id}`}
      onClick={handleCardClick}
      className={cn(
        "group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer",
        todo.isCompleted 
          ? "bg-secondary/30 border-transparent opacity-75" 
          : "bg-card border-border/60 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="pt-1">
          <Checkbox 
            data-testid={`checkbox-todo-${todo.id}`}
            checked={todo.isCompleted} 
            onCheckedChange={handleToggle}
            className="w-5 h-5 rounded-md border-2 border-muted-foreground/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary transition-all"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className={cn(
              "font-display font-semibold text-lg truncate",
              todo.isCompleted && "line-through text-muted-foreground"
            )}>
              {todo.title}
            </h3>
            {todo.isCompleted && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                Done
              </Badge>
            )}
            {needsReview && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Needs Review
              </Badge>
            )}
          </div>

          {todo.description && (
            <p className={cn(
              "text-sm text-muted-foreground line-clamp-2 mb-3",
              todo.isCompleted && "line-through opacity-60"
            )}>
              {todo.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant="outline" className={cn(
              "rounded-lg px-2 py-1 text-xs font-medium border-0",
              catColor.bg, catColor.text
            )}>
              {todo.category}
            </Badge>

            <Badge variant="outline" className={cn(
              "rounded-lg px-2 py-1 text-xs font-medium border-0",
              isProfessional ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
            )}>
              {isProfessional ? <Briefcase className="w-3 h-3 mr-1.5" /> : <User className="w-3 h-3 mr-1.5" />}
              {todo.type === 'personal' ? 'Personal' : 'Professional'}
            </Badge>

            {todo.deadline && (
              <div className={cn(
                "flex items-center text-xs px-2 py-1 rounded-lg",
                new Date(todo.deadline) < new Date() && !todo.isCompleted
                  ? "bg-red-50 text-red-600 font-medium" 
                  : "text-muted-foreground bg-secondary/50"
              )}>
                <Calendar className="w-3 h-3 mr-1.5" />
                {format(new Date(todo.deadline), "MMM d, yyyy")}
              </div>
            )}
            
            <div className="text-xs text-muted-foreground/60 flex items-center ml-auto">
              <Clock className="w-3 h-3 mr-1" />
              Created {format(new Date(todo.createdAt), "MMM d")}
            </div>
          </div>

          {hasRelationships && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
              {relationships?.map((rel) => {
                const { label, Icon, relatedTaskName } = getRelationshipInfo(rel);
                return (
                  <div key={rel.id} className="flex items-center gap-2 text-xs text-muted-foreground" data-testid={`relation-${rel.id}`}>
                    <Icon className="w-3 h-3" />
                    <span className="font-medium">{label}:</span>
                    <span className="truncate">{relatedTaskName}</span>
                  </div>
                );
              })}
              {discussionLinks?.map((link) => (
                <div key={link.id} className="flex items-center gap-2 text-xs text-muted-foreground" data-testid={`discussion-link-${link.id}`}>
                  <MessageSquare className="w-3 h-3" />
                  <span className="font-medium">Discussion:</span>
                  <span className="truncate">#{link.discussionItemId}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          data-testid={`button-delete-${todo.id}`}
          className="absolute top-4 right-4 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
          onClick={() => deleteTodo.mutate(todo.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
    
    <TaskDetailDialog
      todo={todo}
      open={detailOpen}
      onOpenChange={setDetailOpen}
    />
    </>
  );
}
