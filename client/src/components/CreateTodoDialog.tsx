import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTodoSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, CalendarIcon, AlertTriangle } from "lucide-react";
import { validateDeadlineForCategory } from "@shared/deadline-validation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTodo } from "@/hooks/use-todos";
import { useTodoCategories, useTodoTypes } from "@/hooks/use-settings";
import { useCreateTaskRelationship, useCreateTaskDiscussionLink } from "@/hooks/use-relationships";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { RelationshipSelector, type PendingRelationship, type PendingDiscussionLink } from "./RelationshipSelector";

const formSchema = insertTodoSchema.extend({
  deadline: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

const colorClasses: Record<string, string> = {
  red: "text-red-600",
  orange: "text-orange-600",
  yellow: "text-yellow-600",
  green: "text-green-600",
  blue: "text-blue-600",
  purple: "text-purple-600",
  gray: "text-gray-600",
};

export function CreateTodoDialog() {
  const [open, setOpen] = useState(false);
  const [relationships, setRelationships] = useState<PendingRelationship[]>([]);
  const [discussionLinks, setDiscussionLinks] = useState<PendingDiscussionLink[]>([]);
  const { toast } = useToast();
  const createTodo = useCreateTodo();
  const createRelationship = useCreateTaskRelationship();
  const createDiscussionLink = useCreateTaskDiscussionLink();
  const { data: categories } = useTodoCategories();
  const { data: types } = useTodoTypes();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "personal",
      category: "Today",
    },
  });

  const watchedDeadline = useWatch({ control: form.control, name: "deadline" });
  const watchedCategory = useWatch({ control: form.control, name: "category" }) || "Today";
  
  const deadlineValidation = validateDeadlineForCategory(watchedDeadline, watchedCategory);

  async function onSubmit(data: FormData) {
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
      const newTodo = await createTodo.mutateAsync(data);
      
      for (const rel of relationships) {
        await createRelationship.mutateAsync({
          sourceTaskId: newTodo.id,
          targetTaskId: rel.targetTaskId,
          relationshipType: rel.relationshipType,
        });
      }
      
      for (const link of discussionLinks) {
        await createDiscussionLink.mutateAsync({
          taskId: newTodo.id,
          discussionItemId: link.discussionItemId,
        });
      }
      
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      setOpen(false);
      form.reset();
      setRelationships([]);
      setDiscussionLinks([]);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    }
  }

  const handleAddRelationship = (rel: PendingRelationship) => {
    setRelationships(prev => [...prev, rel]);
  };

  const handleRemoveRelationship = (index: number) => {
    setRelationships(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddDiscussionLink = (link: PendingDiscussionLink) => {
    setDiscussionLinks(prev => [...prev, link]);
  };

  const handleRemoveDiscussionLink = (index: number) => {
    setDiscussionLinks(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-todo" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          <Plus className="w-5 h-5 mr-2" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Create New Task</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Title</FormLabel>
                  <FormControl>
                    <Input data-testid="input-title" placeholder="What needs to be done?" className="rounded-xl bg-secondary border-transparent focus:border-primary/20 focus:bg-white transition-all" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-type" className="rounded-xl bg-secondary border-transparent focus:border-primary/20 focus:bg-white transition-all">
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category" className="rounded-xl bg-secondary border-transparent focus:border-primary/20 focus:bg-white transition-all">
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal rounded-xl bg-secondary border-transparent hover:bg-secondary",
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
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                        className="rounded-xl border-0"
                      />
                    </PopoverContent>
                  </Popover>
                  {!deadlineValidation.valid && (
                    <div className="flex items-center gap-2 text-sm text-destructive mt-1" data-testid="validation-warning">
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      data-testid="input-description"
                      placeholder="Add details..." 
                      className="rounded-xl bg-secondary border-transparent focus:border-primary/20 focus:bg-white transition-all min-h-[80px]" 
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <RelationshipSelector
              relationships={relationships}
              discussionLinks={discussionLinks}
              onAddRelationship={handleAddRelationship}
              onRemoveRelationship={handleRemoveRelationship}
              onAddDiscussionLink={handleAddDiscussionLink}
              onRemoveDiscussionLink={handleRemoveDiscussionLink}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl hover:bg-secondary">
                Cancel
              </Button>
              <Button data-testid="button-submit" type="submit" disabled={createTodo.isPending} className="rounded-xl px-6">
                {createTodo.isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
