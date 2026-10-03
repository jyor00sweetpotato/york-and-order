import { useState, useMemo } from "react";
import { useTodos } from "@/hooks/use-todos";
import { useColleagues, useDiscussionItems } from "@/hooks/use-colleagues";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Link2, ArrowRight, ArrowLeft, MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Todo, DiscussionItem } from "@shared/schema";

type RelationshipType = 'blocks' | 'blocked_by' | 'associated';
type DiscussionLinkType = 'linked';

export type PendingRelationship = {
  targetTaskId: number;
  relationshipType: RelationshipType;
  targetTask?: Todo;
};

export type PendingDiscussionLink = {
  discussionItemId: number;
  discussionItem?: DiscussionItem;
};

interface RelationshipSelectorProps {
  excludeTaskId?: number;
  relationships: PendingRelationship[];
  discussionLinks: PendingDiscussionLink[];
  onAddRelationship: (rel: PendingRelationship) => void;
  onRemoveRelationship: (index: number) => void;
  onAddDiscussionLink: (link: PendingDiscussionLink) => void;
  onRemoveDiscussionLink: (index: number) => void;
}

const relationshipLabels: Record<RelationshipType, { label: string; icon: typeof ArrowRight; description: string }> = {
  blocks: { label: "Blocks", icon: ArrowRight, description: "This task must be done first" },
  blocked_by: { label: "Blocked by", icon: ArrowLeft, description: "That task must be done first" },
  associated: { label: "Related to", icon: Link2, description: "Connected tasks" },
};

export function RelationshipSelector({
  excludeTaskId,
  relationships,
  discussionLinks,
  onAddRelationship,
  onRemoveRelationship,
  onAddDiscussionLink,
  onRemoveDiscussionLink,
}: RelationshipSelectorProps) {
  const [taskSearch, setTaskSearch] = useState("");
  const [discussionSearch, setDiscussionSearch] = useState("");
  const [selectedRelType, setSelectedRelType] = useState<RelationshipType>("associated");
  const [showTaskSearch, setShowTaskSearch] = useState(false);
  const [showDiscussionSearch, setShowDiscussionSearch] = useState(false);

  const { data: allTodos } = useTodos({ status: 'pending' });
  const { data: colleagues } = useColleagues();
  const { data: allDiscussionItems } = useDiscussionItems();

  const filteredTasks = useMemo(() => {
    if (!allTodos) return [];
    const alreadyLinked = new Set(relationships.map(r => r.targetTaskId));
    return allTodos
      .filter(t => t.id !== excludeTaskId)
      .filter(t => !alreadyLinked.has(t.id))
      .filter(t => 
        taskSearch.trim() === "" || 
        t.title.toLowerCase().includes(taskSearch.toLowerCase())
      )
      .slice(0, 10);
  }, [allTodos, taskSearch, excludeTaskId, relationships]);

  const filteredDiscussions = useMemo(() => {
    if (!allDiscussionItems) return [];
    const alreadyLinked = new Set(discussionLinks.map(l => l.discussionItemId));
    return allDiscussionItems
      .filter(d => !alreadyLinked.has(d.id))
      .filter(d => d.status !== 'Discussed')
      .filter(d =>
        discussionSearch.trim() === "" ||
        d.description.toLowerCase().includes(discussionSearch.toLowerCase())
      )
      .slice(0, 10);
  }, [allDiscussionItems, discussionSearch, discussionLinks]);

  const getColleagueName = (colleagueId: number) => {
    return colleagues?.find(c => c.id === colleagueId)?.name || "Unknown";
  };

  const handleSelectTask = (task: Todo) => {
    onAddRelationship({
      targetTaskId: task.id,
      relationshipType: selectedRelType,
      targetTask: task,
    });
    setTaskSearch("");
    setShowTaskSearch(false);
  };

  const handleSelectDiscussion = (item: DiscussionItem) => {
    onAddDiscussionLink({
      discussionItemId: item.id,
      discussionItem: item,
    });
    setDiscussionSearch("");
    setShowDiscussionSearch(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-sm">Related Tasks</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTaskSearch(!showTaskSearch)}
            className="text-xs"
            data-testid="button-add-task-relation"
          >
            <Link2 className="w-3 h-3 mr-1" />
            Link Task
          </Button>
        </div>

        {showTaskSearch && (
          <div className="space-y-2 p-3 rounded-xl bg-secondary/50">
            <div className="flex gap-2">
              <Select value={selectedRelType} onValueChange={(v) => setSelectedRelType(v as RelationshipType)}>
                <SelectTrigger className="w-[140px] rounded-lg text-xs" data-testid="select-relationship-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(relationshipLabels).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="pl-8 rounded-lg text-sm"
                  data-testid="input-task-search"
                />
              </div>
            </div>
            
            {filteredTasks.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 overscroll-contain touch-pan-y">
                {filteredTasks.map(task => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleSelectTask(task)}
                    className="w-full text-left px-3 py-2 rounded-lg hover-elevate text-sm truncate"
                    data-testid={`button-select-task-${task.id}`}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            )}
            {taskSearch && filteredTasks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No matching tasks found</p>
            )}
          </div>
        )}

        {relationships.length > 0 && (
          <div className="space-y-2">
            {relationships.map((rel, index) => {
              const { icon: Icon, label } = relationshipLabels[rel.relationshipType];
              return (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                  <Badge variant="outline" className="text-xs gap-1">
                    <Icon className="w-3 h-3" />
                    {label}
                  </Badge>
                  <span className="text-sm flex-1 truncate">{rel.targetTask?.title || `Task #${rel.targetTaskId}`}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                    onClick={() => onRemoveRelationship(index)}
                    data-testid={`button-remove-relation-${index}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-sm">Linked Discussions</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDiscussionSearch(!showDiscussionSearch)}
            className="text-xs"
            data-testid="button-add-discussion-link"
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Link Discussion
          </Button>
        </div>

        {showDiscussionSearch && (
          <div className="space-y-2 p-3 rounded-xl bg-secondary/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search discussion topics..."
                value={discussionSearch}
                onChange={(e) => setDiscussionSearch(e.target.value)}
                className="pl-8 rounded-lg text-sm"
                data-testid="input-discussion-search"
              />
            </div>
            
            {filteredDiscussions.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 overscroll-contain touch-pan-y">
                {filteredDiscussions.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectDiscussion(item)}
                    className="w-full text-left px-3 py-2 rounded-lg hover-elevate text-sm"
                    data-testid={`button-select-discussion-${item.id}`}
                  >
                    <span className="truncate block">{item.description}</span>
                    <span className="text-xs text-muted-foreground">with {getColleagueName(item.colleagueId)}</span>
                  </button>
                ))}
              </div>
            )}
            {discussionSearch && filteredDiscussions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No matching discussions found</p>
            )}
          </div>
        )}

        {discussionLinks.length > 0 && (
          <div className="space-y-2">
            {discussionLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm truncate block">{link.discussionItem?.description || `Discussion #${link.discussionItemId}`}</span>
                  {link.discussionItem && (
                    <span className="text-xs text-muted-foreground">with {getColleagueName(link.discussionItem.colleagueId)}</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 flex-shrink-0"
                  onClick={() => onRemoveDiscussionLink(index)}
                  data-testid={`button-remove-discussion-${index}`}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
