import { useState } from "react";
import { useColleagues, useDiscussionItems, useCreateDiscussionItem, useUpdateDiscussionItem, useDeleteDiscussionItem } from "@/hooks/use-colleagues";
import { useDiscussionStatuses } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Users, Plus, MessageSquare, Archive, Trash2, Edit2, Loader2, Calendar, Clock, X } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { DiscussionItem } from "@shared/schema";

const statusColors: Record<string, { bg: string; text: string }> = {
  "To Discuss": { bg: "bg-blue-100", text: "text-blue-700" },
  "Ongoing": { bg: "bg-yellow-100", text: "text-yellow-700" },
  "Discussed": { bg: "bg-green-100", text: "text-green-700" },
};

function DiscussionItemCard({ item, onUpdate, onDelete }: { 
  item: DiscussionItem; 
  onUpdate: (id: number, updates: Partial<DiscussionItem>) => void;
  onDelete: (id: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const { data: statuses } = useDiscussionStatuses();
  const statusColor = statusColors[item.status] || statusColors["To Discuss"];

  const handleStatusChange = (newStatus: string) => {
    onUpdate(item.id, { status: newStatus });
  };

  const handleSaveNotes = () => {
    onUpdate(item.id, { notes });
    setIsEditing(false);
  };

  const handleDueDateChange = (date: Date | undefined) => {
    onUpdate(item.id, { dueDate: date || null });
    setDueDateOpen(false);
  };

  const isDueDateOverdue = item.dueDate && isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) && item.status !== "Discussed";
  const isDueDateToday = item.dueDate && isToday(new Date(item.dueDate));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card data-testid={`card-discussion-${item.id}`} className={cn("p-4 hover:shadow-lg transition-all", isDueDateOverdue && "border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20")}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground mb-2">{item.description}</p>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Select value={item.status} onValueChange={handleStatusChange}>
                <SelectTrigger data-testid={`select-status-${item.id}`} className="w-auto h-7 text-xs rounded-lg border-0 bg-secondary">
                  <Badge variant="outline" className={cn("rounded-lg px-2 py-0.5 text-xs border-0", statusColor.bg, statusColor.text)}>
                    {item.status}
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  {statuses?.map((s) => (
                    <SelectItem key={s.id} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-7 text-xs rounded-lg",
                      isDueDateOverdue && "text-red-600 dark:text-red-400",
                      isDueDateToday && "text-amber-600 dark:text-amber-400"
                    )}
                    data-testid={`button-duedate-${item.id}`}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {item.dueDate ? (
                      <>Due {format(new Date(item.dueDate), "MMM d")}</>
                    ) : (
                      <>Set due date</>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-2 border-b flex justify-between items-center">
                    <span className="text-sm font-medium">Due Date</span>
                    {item.dueDate && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={() => handleDueDateChange(undefined)}
                        data-testid={`button-clear-duedate-${item.id}`}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={item.dueDate ? new Date(item.dueDate) : undefined}
                    onSelect={handleDueDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 mr-1" />
                {item.discussedAt ? (
                  <>Discussed {format(new Date(item.discussedAt), "MMM d, yyyy")}</>
                ) : (
                  <>Added {format(new Date(item.createdAt), "MMM d, yyyy")}</>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes from your discussion..."
                  className="min-h-[80px] text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNotes}>Save Notes</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                {item.notes ? (
                  <div className="bg-secondary/30 rounded-lg p-3 text-sm text-muted-foreground">
                    <p className="text-xs font-medium text-foreground mb-1">Notes:</p>
                    {item.notes}
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Add notes
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {!isEditing && item.notes && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-red-500"
              data-testid={`button-delete-discussion-${item.id}`}
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function AddDiscussionItemDialog({ colleagueId, onSuccess }: { colleagueId: number; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const createItem = useCreateDiscussionItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    
    await createItem.mutateAsync({
      colleagueId,
      description: description.trim(),
      status: "To Discuss",
      dueDate: dueDate || null,
    });
    setDescription("");
    setDueDate(undefined);
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-discussion-item" className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add Topic
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Discussion Topic</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Textarea
            data-testid="input-discussion-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do you want to discuss?"
            className="min-h-[100px]"
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Due Date (optional)</label>
            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                  data-testid="input-discussion-duedate"
                  type="button"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "MMMM d, yyyy") : "Pick a due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2 border-b flex justify-between items-center">
                  <span className="text-sm font-medium">Due Date</span>
                  {dueDate && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => { setDueDate(undefined); setDueDateOpen(false); }}
                      data-testid="button-clear-new-discussion-duedate"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => { setDueDate(date); setDueDateOpen(false); }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="button-submit-discussion" type="submit" disabled={createItem.isPending || !description.trim()}>
              {createItem.isPending ? "Adding..." : "Add Topic"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function OneOnOnesView() {
  const [selectedColleagueId, setSelectedColleagueId] = useState<number | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  
  const { data: colleagues, isLoading: colleaguesLoading } = useColleagues();
  const { data: items, isLoading: itemsLoading } = useDiscussionItems({
    colleagueId: selectedColleagueId || undefined,
    archived: showArchive,
  });

  const updateItem = useUpdateDiscussionItem();
  const deleteItem = useDeleteDiscussionItem();

  const selectedColleague = colleagues?.find(c => c.id === selectedColleagueId);

  const handleUpdate = (id: number, updates: Partial<DiscussionItem>) => {
    updateItem.mutate({ id, ...updates });
  };

  const handleDelete = (id: number) => {
    deleteItem.mutate(id);
  };

  if (colleaguesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">1:1 Discussions</h2>
            <p className="text-muted-foreground mt-1 text-lg">
              Track topics for your one-on-one meetings
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <p className="text-sm font-medium text-muted-foreground mb-3">Select a colleague</p>
          {colleagues?.length === 0 ? (
            <Card className="p-4 text-center text-muted-foreground">
              <p className="text-sm">No colleagues yet.</p>
              <p className="text-xs mt-1">Add colleagues in Settings.</p>
            </Card>
          ) : (
            colleagues?.map((colleague) => (
              <Button
                key={colleague.id}
                variant={selectedColleagueId === colleague.id ? "default" : "ghost"}
                className="w-full justify-start rounded-xl"
                data-testid={`button-colleague-${colleague.id}`}
                onClick={() => setSelectedColleagueId(colleague.id)}
              >
                <Users className="w-4 h-4 mr-2" />
                {colleague.name}
              </Button>
            ))
          )}
        </div>

        <div className="md:col-span-3">
          {selectedColleague ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedColleague.name}</h3>
                <AddDiscussionItemDialog colleagueId={selectedColleague.id} />
              </div>

              <Tabs value={showArchive ? "archive" : "active"} onValueChange={(v) => setShowArchive(v === "archive")}>
                <TabsList className="rounded-xl">
                  <TabsTrigger value="active" className="rounded-lg" data-testid="tab-active">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="archive" className="rounded-lg" data-testid="tab-archive">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-4 space-y-3">
                  {itemsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : items?.length === 0 ? (
                    <Card className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                      <h4 className="font-semibold text-foreground">No active topics</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add topics you want to discuss with {selectedColleague.name}
                      </p>
                    </Card>
                  ) : (
                    <AnimatePresence>
                      {items?.map((item) => (
                        <DiscussionItemCard 
                          key={item.id} 
                          item={item} 
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </TabsContent>

                <TabsContent value="archive" className="mt-4 space-y-3">
                  {itemsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : items?.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Archive className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                      <h4 className="font-semibold text-foreground">No archived topics</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Topics marked as "Discussed" will appear here
                      </p>
                    </Card>
                  ) : (
                    <AnimatePresence>
                      {items?.map((item) => (
                        <DiscussionItemCard 
                          key={item.id} 
                          item={item} 
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h4 className="text-xl font-semibold text-foreground">Select a colleague</h4>
              <p className="text-muted-foreground mt-2">
                Choose someone from the list to view and manage your discussion topics
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
