import { useState, useEffect } from "react";
import { format } from "date-fns";
import { type Todo, type DiscussionItem, insertTodoSchema } from "@shared/schema";
import { useUpdateTodo, useDeleteTodo, useTodos } from "@/hooks/use-todos";
import { useTaskRelationships, useTaskDiscussionLinks, useCreateTaskRelationship, useDeleteTaskRelationship, useCreateTaskDiscussionLink, useDeleteTaskDiscussionLink } from "@/hooks/use-relationships";
import { useColleagues } from "@/hooks/use-colleagues";
import { useTodoCategories, useTodoTypes } from "@/hooks/use-settings";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RelationshipSelector, type PendingRelationship, type PendingDiscussionLink } from "./RelationshipSelector";
import { validateDeadlineForCategory } from "@shared/deadline-validation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Calendar as CalendarIcon, Clock, Briefcase, User, Link2, ArrowRight, ArrowLeft, MessageSquare, AlertTriangle, CheckCircle2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const categoryColors: Record<string, { bg: string; text: string }> = {
  "ASAP": { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  "Today": { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  "This Week": { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300" },
  "Next Week": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  "Eventually": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  "Parking Lot": { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
};

const colorClasses: Record<string, string> = {
  red: "text-red-600",
  orange: "text-orange-600",
  yellow: "text-yellow-600",
  green: "text-green-600",
  blue: "text-blue-600",
  purple: "text-purple-600",
  gray: "text-gray-600",
};

const formSchema = insertTodoSchema.extend({
  deadline: z.date().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface TaskDetailDialogProps {
  todo: Todo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({ todo, open, onOpenChange }: TaskDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [pendingRelationships, setPendingRelationships] = useState<PendingRelationship[]>([]);
  const [pendingDiscussionLinks, setPendingDiscussionLinks] = useState<PendingDiscussionLink[]>([]);
  const [relationshipsToDelete, setRelationshipsToDelete] = useState<number[]>([]);
  const [discussionLinksToDelete, setDiscussionLinksToDelete] = useState<number[]>([]);
  const { toast } = useToast();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const createRelationship = useCreateTaskRelationship();
  const deleteRelationship = useDeleteTaskRelationship();
  const createDiscussionLink = useCreateTaskDiscussionLink();
  const deleteDiscussionLink = useDeleteTaskDiscussionLink();
  const { data: allTodos } = useTodos();
  const { data: relationships, refetch: refetchRelationships } = useTaskRelationships(todo.id);
  const { data: discussionLinks, refetch: refetchDiscussionLinks } = useTaskDiscussionLinks(todo.id);
  const { data: colleagues } = useColleagues();
  const { data: discussionItems } = useQuery<DiscussionItem[]>({ queryKey: ['/api/discussion-items'] });
  const { data: categories } = useTodoCategories();
  const { data: types } = useTodoTypes();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: todo.title,
      description: todo.description || "",
      category: todo.category,
      type: todo.type,
      deadline: todo.deadline ? new Date(todo.deadline) : undefined,
    },
  });

  const watchedDeadline = useWatch({ control: form.control, name: "deadline" });
  const watchedCategory = useWatch({ control: form.control, name: "category" }) || "Today";
  const deadlineValidation = validateDeadlineForCategory(watchedDeadline, watchedCategory);

  useEffect(() => {
    if (open) {
      form.reset({
        title: todo.title,
        description: todo.description || "",
        category: todo.category,
        type: todo.type,
        deadline: todo.deadline ? new Date(todo.deadline) : undefined,
      });
      setIsEditing(false);
      setPendingRelationships([]);
      setPendingDiscussionLinks([]);
      setRelationshipsToDelete([]);
      setDiscussionLinksToDelete([]);
    }
  }, [open, todo, form]);

  const isProfessional = todo.type === 'professional';
  const catColor = categoryColors[todo.category] || categoryColors["Today"];
  const isOverdue = todo.deadline && new Date(todo.deadline) < new Date() && !todo.isCompleted;

  const handleToggle = () => {
    updateTodo.mutate({
      id: todo.id,
      isCompleted: !todo.isCompleted,
    });
  };

  const handleDelete = () => {
    deleteTodo.mutate(todo.id);
    onOpenChange(false);
  };

  const handleSave = async (data: FormData) => {
    const validation = validateDeadlineForCategory(data.deadline, data.category || "Today");
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateTodo.mutateAsync({
        id: todo.id,
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type,
        deadline: data.deadline || undefined,
      });
      
      for (const relId of relationshipsToDelete) {
        await deleteRelationship.mutateAsync(relId);
      }
      
      for (const rel of pendingRelationships) {
        await createRelationship.mutateAsync({
          sourceTaskId: todo.id,
          targetTaskId: rel.targetTaskId,
          relationshipType: rel.relationshipType,
        });
      }
      
      for (const linkId of discussionLinksToDelete) {
        await deleteDiscussionLink.mutateAsync(linkId);
      }
      
      for (const link of pendingDiscussionLinks) {
        await createDiscussionLink.mutateAsync({
          taskId: todo.id,
          discussionItemId: link.discussionItemId,
        });
      }
      
      await refetchRelationships();
      await refetchDiscussionLinks();
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      setIsEditing(false);
      setPendingRelationships([]);
      setPendingDiscussionLinks([]);
      setRelationshipsToDelete([]);
      setDiscussionLinksToDelete([]);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    form.reset({
      title: todo.title,
      description: todo.description || "",
      category: todo.category,
      type: todo.type,
      deadline: todo.deadline ? new Date(todo.deadline) : undefined,
    });
    setIsEditing(false);
    setPendingRelationships([]);
    setPendingDiscussionLinks([]);
    setRelationshipsToDelete([]);
    setDiscussionLinksToDelete([]);
  };

  const existingRelationships: PendingRelationship[] = (relationships || [])
    .filter(rel => !relationshipsToDelete.includes(rel.id))
    .map(rel => {
      const isSource = rel.sourceTaskId === todo.id;
      const targetTaskId = isSource ? rel.targetTaskId : rel.sourceTaskId;
      const targetTask = allTodos?.find(t => t.id === targetTaskId);
      return {
        id: rel.id,
        targetTaskId,
        relationshipType: rel.relationshipType as 'blocks' | 'blocked_by' | 'associated',
        targetTask,
      };
    });

  const existingDiscussionLinks: PendingDiscussionLink[] = (discussionLinks || [])
    .filter(link => !discussionLinksToDelete.includes(link.id))
    .map(link => {
      const discussionItem = discussionItems?.find(d => d.id === link.discussionItemId);
      return {
        id: link.id,
        discussionItemId: link.discussionItemId,
        discussionItem,
      };
    });

  const allRelationships = [...existingRelationships, ...pendingRelationships];
  const allDiscussionLinks = [...existingDiscussionLinks, ...pendingDiscussionLinks];

  const handleAddRelationship = (rel: PendingRelationship) => {
    setPendingRelationships(prev => [...prev, rel]);
  };

  const handleRemoveRelationship = (index: number) => {
    if (index < existingRelationships.length) {
      const rel = existingRelationships[index];
      if ((rel as any).id) {
        setRelationshipsToDelete(prev => [...prev, (rel as any).id]);
      }
    } else {
      const pendingIndex = index - existingRelationships.length;
      setPendingRelationships(prev => prev.filter((_, i) => i !== pendingIndex));
    }
  };

  const handleAddDiscussionLink = (link: PendingDiscussionLink) => {
    setPendingDiscussionLinks(prev => [...prev, link]);
  };

  const handleRemoveDiscussionLink = (index: number) => {
    if (index < existingDiscussionLinks.length) {
      const link = existingDiscussionLinks[index];
      if ((link as any).id) {
        setDiscussionLinksToDelete(prev => [...prev, (link as any).id]);
      }
    } else {
      const pendingIndex = index - existingDiscussionLinks.length;
      setPendingDiscussionLinks(prev => prev.filter((_, i) => i !== pendingIndex));
    }
  };

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
      label = "Related to";
      Icon = Link2;
    }
    
    return { label, Icon, relatedTaskName };
  };

  const getDiscussionInfo = (discussionItemId: number) => {
    const item = discussionItems?.find((d: DiscussionItem) => d.id === discussionItemId);
    if (!item) return { description: `Discussion #${discussionItemId}`, colleagueName: "Unknown" };
    
    const colleague = colleagues?.find(c => c.id === item.colleagueId);
    return {
      description: item.description,
      colleagueName: colleague?.name || "Unknown",
    };
  };

  const hasRelationships = (relationships && relationships.length > 0) || (discussionLinks && discussionLinks.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-3">
            {!isEditing && (
              <Checkbox
                checked={todo.isCompleted}
                onCheckedChange={handleToggle}
                className="w-6 h-6 rounded-lg border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                data-testid={`checkbox-detail-${todo.id}`}
              />
            )}
            <span className={cn(!isEditing && todo.isCompleted && "line-through opacity-60")}>
              {isEditing ? "Edit Task" : (todo.title || "Untitled Task")}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? "Edit task details" : "View and manage task details"}
          </DialogDescription>
        </DialogHeader>
        
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Title</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-edit-title" 
                        placeholder="Task title" 
                        className="rounded-xl bg-secondary border-transparent focus:border-primary/20 focus:bg-white transition-all" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        data-testid="input-edit-description"
                        placeholder="Task description" 
                        className="rounded-xl bg-secondary border-transparent focus:border-primary/20 focus:bg-white transition-all min-h-[80px]" 
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-type" className="rounded-xl bg-secondary border-transparent focus:border-primary/20 focus:bg-white transition-all">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl shadow-xl border-border/50">
                          {types?.map((type) => (
                            <SelectItem key={type.id} value={type.value}>
                              <span className={colorClasses[type.color || 'gray']}>{type.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-category" className="rounded-xl bg-secondary border-transparent focus:border-primary/20 focus:bg-white transition-all">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl shadow-xl border-border/50">
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.value}>
                              <span className={colorClasses[cat.color || 'gray']}>{cat.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-semibold">Deadline (Optional)</FormLabel>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              data-testid="button-edit-deadline"
                              className={cn(
                                "flex-1 pl-3 text-left font-normal rounded-xl bg-secondary border-transparent hover:bg-secondary",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            className="rounded-xl border-0"
                          />
                        </PopoverContent>
                      </Popover>
                      {field.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => field.onChange(null)}
                          className="rounded-xl"
                          data-testid="button-clear-deadline"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {!deadlineValidation.valid && (
                      <div className="flex items-center gap-2 text-sm text-destructive mt-1" data-testid="edit-validation-warning">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{deadlineValidation.message}</span>
                        {deadlineValidation.suggestedCategory && (
                          <span className="text-muted-foreground">(Suggested: {deadlineValidation.suggestedCategory})</span>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <RelationshipSelector
                excludeTaskId={todo.id}
                relationships={allRelationships}
                discussionLinks={allDiscussionLinks}
                onAddRelationship={handleAddRelationship}
                onRemoveRelationship={handleRemoveRelationship}
                onAddDiscussionLink={handleAddDiscussionLink}
                onRemoveDiscussionLink={handleRemoveDiscussionLink}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={handleCancelEdit} className="rounded-xl" data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button data-testid="button-save-edit" type="submit" disabled={updateTodo.isPending} className="rounded-xl px-6">
                  {updateTodo.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium border-0",
                catColor.bg, catColor.text
              )}>
                {todo.category}
              </Badge>

              <Badge variant="outline" className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium border-0",
                isProfessional ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
              )}>
                {isProfessional ? <Briefcase className="w-3.5 h-3.5 mr-1.5" /> : <User className="w-3.5 h-3.5 mr-1.5" />}
                {todo.type === 'personal' ? 'Personal' : 'Professional'}
              </Badge>

              {todo.isCompleted && (
                <Badge variant="secondary" className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Completed
                </Badge>
              )}

              {isOverdue && (
                <Badge variant="secondary" className="text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                  Overdue
                </Badge>
              )}
            </div>

            {todo.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Description</h4>
                <p className={cn(
                  "text-foreground bg-secondary/50 rounded-xl p-4",
                  todo.isCompleted && "opacity-60"
                )}>
                  {todo.description}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm">
              {todo.deadline && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg",
                  isOverdue
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium" 
                    : "bg-secondary text-muted-foreground"
                )}>
                  <CalendarIcon className="w-4 h-4" />
                  <span>Due: {format(new Date(todo.deadline), "MMMM d, yyyy")}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Created: {format(new Date(todo.createdAt), "MMMM d, yyyy")}</span>
              </div>

              {todo.completedAt && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed: {format(new Date(todo.completedAt), "MMMM d, yyyy")}</span>
                </div>
              )}
            </div>

            {hasRelationships && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Related Items</h4>
                <div className="space-y-2 bg-secondary/50 rounded-xl p-4">
                  {relationships?.map((rel) => {
                    const { label, Icon, relatedTaskName } = getRelationshipInfo(rel);
                    return (
                      <div key={rel.id} className="flex items-center gap-3 text-sm" data-testid={`detail-relation-${rel.id}`}>
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">{label}:</span>
                        <span className="text-foreground">{relatedTaskName}</span>
                      </div>
                    );
                  })}
                  {discussionLinks?.map((link) => {
                    const { description, colleagueName } = getDiscussionInfo(link.discussionItemId);
                    return (
                      <div key={link.id} className="flex items-center gap-3 text-sm" data-testid={`detail-discussion-link-${link.id}`}>
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">1:1 with {colleagueName}:</span>
                        <span className="text-foreground truncate">{description}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                onClick={handleDelete}
                data-testid={`button-detail-delete-${todo.id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setIsEditing(true)}
                  data-testid={`button-detail-edit-${todo.id}`}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  className="rounded-xl"
                  onClick={handleToggle}
                  data-testid={`button-detail-toggle-${todo.id}`}
                >
                  {todo.isCompleted ? "Mark as Pending" : "Mark as Complete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
