import { useState } from "react";
import { useSettings, useCreateSetting, useDeleteSetting } from "@/hooks/use-settings";
import { useColleagues, useCreateColleague, useDeleteColleague } from "@/hooks/use-colleagues";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, X, Tag, Users, Loader2, ListTodo, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const colorOptions = [
  { value: "red", label: "Red", class: "bg-red-100 text-red-700" },
  { value: "orange", label: "Orange", class: "bg-orange-100 text-orange-700" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-100 text-yellow-700" },
  { value: "green", label: "Green", class: "bg-green-100 text-green-700" },
  { value: "blue", label: "Blue", class: "bg-blue-100 text-blue-700" },
  { value: "purple", label: "Purple", class: "bg-purple-100 text-purple-700" },
  { value: "gray", label: "Gray", class: "bg-gray-100 text-gray-700" },
];

function SettingsList({ group, title, description, icon: Icon }: {
  group: string;
  title: string;
  description: string;
  icon: typeof Tag;
}) {
  const { data: settings, isLoading } = useSettings(group);
  const createSetting = useCreateSetting();
  const deleteSetting = useDeleteSetting();
  const { toast } = useToast();
  
  const [newValue, setNewValue] = useState("");
  const [newColor, setNewColor] = useState("blue");

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    
    try {
      await createSetting.mutateAsync({
        group,
        value: newValue.trim(),
        label: newValue.trim(),
        color: newColor,
      });
      setNewValue("");
      toast({ title: "Added", description: `${newValue} has been added.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number, label: string) => {
    try {
      await deleteSetting.mutateAsync(id);
      toast({ title: "Removed", description: `${label} has been removed.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove item", variant: "destructive" });
    }
  };

  const getColorClass = (color: string | null) => {
    const found = colorOptions.find(c => c.value === color);
    return found?.class || "bg-gray-100 text-gray-700";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {settings?.map((setting) => (
                <Badge 
                  key={setting.id} 
                  variant="outline"
                  className={cn("rounded-lg px-3 py-1.5 text-sm border-0 group", getColorClass(setting.color))}
                >
                  {setting.label}
                  <button
                    data-testid={`button-delete-setting-${setting.id}`}
                    onClick={() => handleDelete(setting.id, setting.label)}
                    className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {settings?.length === 0 && (
                <p className="text-sm text-muted-foreground">No items yet. Add one below.</p>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Input
                data-testid={`input-new-${group}`}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Add new item..."
                className="flex-1 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Select value={newColor} onValueChange={setNewColor}>
                <SelectTrigger className="w-24 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", color.class.split(" ")[0])} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                data-testid={`button-add-${group}`}
                onClick={handleAdd} 
                disabled={createSetting.isPending || !newValue.trim()}
                className="rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ColleaguesList() {
  const { data: colleagues, isLoading } = useColleagues();
  const createColleague = useCreateColleague();
  const deleteColleague = useDeleteColleague();
  const { toast } = useToast();
  
  const [newName, setNewName] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    
    try {
      await createColleague.mutateAsync({ name: newName.trim() });
      setNewName("");
      toast({ title: "Added", description: `${newName} has been added as a colleague.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add colleague", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteColleague.mutateAsync(id);
      toast({ title: "Removed", description: `${name} has been removed.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove colleague", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Colleagues</CardTitle>
            <CardDescription>People you have 1:1 meetings with</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {colleagues?.map((colleague) => (
                <Badge 
                  key={colleague.id} 
                  variant="outline"
                  className="rounded-lg px-3 py-1.5 text-sm border-0 bg-indigo-50 text-indigo-700 group"
                >
                  {colleague.name}
                  <button
                    data-testid={`button-delete-colleague-${colleague.id}`}
                    onClick={() => handleDelete(colleague.id, colleague.name)}
                    className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {colleagues?.length === 0 && (
                <p className="text-sm text-muted-foreground">No colleagues yet. Add one below.</p>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Input
                data-testid="input-new-colleague"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Add colleague name..."
                className="flex-1 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Button 
                data-testid="button-add-colleague"
                onClick={handleAdd} 
                disabled={createColleague.isPending || !newName.trim()}
                className="rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function SettingsView() {
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <header className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-gray-100 text-gray-600">
          <Settings className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">Settings</h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Customize categories, types, and manage your colleagues
          </p>
        </div>
      </header>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="rounded-xl mb-6">
          <TabsTrigger value="todos" className="rounded-lg">
            <ListTodo className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="discussions" className="rounded-lg">
            <MessageSquare className="w-4 h-4 mr-2" />
            1:1 Discussions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-6">
          <SettingsList 
            group="todo_category"
            title="Task Categories"
            description="Priority levels for organizing your tasks"
            icon={Tag}
          />
          <SettingsList 
            group="todo_type"
            title="Task Types"
            description="Personal or professional task classification"
            icon={Tag}
          />
        </TabsContent>

        <TabsContent value="discussions" className="space-y-6">
          <ColleaguesList />
          <SettingsList 
            group="discussion_status"
            title="Discussion Statuses"
            description="Track the progress of your 1:1 discussion topics"
            icon={MessageSquare}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
