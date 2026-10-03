import { useTodoStats } from "@/hooks/use-todos";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, User, Briefcase, Loader2, TrendingUp, Calendar, CalendarDays, Infinity } from "lucide-react";
import { format } from "date-fns";

function formatHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  const days = Math.round(hours / 24 * 10) / 10;
  return `${days} days`;
}

interface PeriodStatsProps {
  stats: {
    total: number;
    personal: number;
    professional: number;
    avgCompletionTimeHours: number | null;
    personalAvgHours: number | null;
    professionalAvgHours: number | null;
  };
  periodLabel: string;
}

function PeriodStats({ stats, periodLabel }: PeriodStatsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500 rounded-lg text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-green-800">Total Completed</span>
          </div>
          <p className="text-4xl font-bold text-green-700">{stats.total}</p>
          <p className="text-sm text-green-600 mt-1">{periodLabel}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500 rounded-lg text-white">
              <User className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-purple-800">Personal</span>
          </div>
          <p className="text-4xl font-bold text-purple-700">{stats.personal}</p>
          <p className="text-sm text-purple-600 mt-1">
            Avg: {formatHours(stats.personalAvgHours)} to complete
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500 rounded-lg text-white">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-blue-800">Professional</span>
          </div>
          <p className="text-4xl font-bold text-blue-700">{stats.professional}</p>
          <p className="text-sm text-blue-600 mt-1">
            Avg: {formatHours(stats.professionalAvgHours)} to complete
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Average Time to Complete</h3>
            <p className="text-sm text-muted-foreground">How long tasks take from creation to completion</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-secondary/30 rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Overall</p>
            <p className="text-2xl font-bold text-foreground">{formatHours(stats.avgCompletionTimeHours)}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-purple-600 mb-1">Personal Tasks</p>
            <p className="text-2xl font-bold text-purple-700">{formatHours(stats.personalAvgHours)}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-600 mb-1">Professional Tasks</p>
            <p className="text-2xl font-bold text-blue-700">{formatHours(stats.professionalAvgHours)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function ReportsView() {
  const { data: stats, isLoading } = useTodoStats();

  if (isLoading || !stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          Productivity Reports
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          Track your task completion across different time periods.
        </p>
      </header>

      <Tabs defaultValue="week" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="week" className="flex items-center gap-2" data-testid="tab-this-week">
            <Calendar className="w-4 h-4" />
            This Week
          </TabsTrigger>
          <TabsTrigger value="month" className="flex items-center gap-2" data-testid="tab-this-month">
            <CalendarDays className="w-4 h-4" />
            This Month
          </TabsTrigger>
          <TabsTrigger value="alltime" className="flex items-center gap-2" data-testid="tab-all-time">
            <Infinity className="w-4 h-4" />
            All Time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="week">
          <PeriodStats stats={stats.thisWeek} periodLabel="Monday to Sunday" />
        </TabsContent>

        <TabsContent value="month">
          <PeriodStats stats={stats.thisMonth} periodLabel={`Since ${format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "MMMM d")}`} />
        </TabsContent>

        <TabsContent value="alltime">
          <PeriodStats stats={stats.allTime} periodLabel="All completed tasks" />
        </TabsContent>
      </Tabs>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 font-display">Recent Completions</h3>
        <div className="space-y-3">
          {stats.recentCompletions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No recently completed tasks.</p>
          ) : (
            stats.recentCompletions.map((todo) => (
              <div key={todo.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-700 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground line-through decoration-muted-foreground/50 text-muted-foreground">
                      {todo.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {todo.type === 'personal' ? (
                        <span className="text-xs text-purple-600 flex items-center gap-1">
                          <User className="w-3 h-3" /> Personal
                        </span>
                      ) : (
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> Professional
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {todo.completedAt && format(new Date(todo.completedAt), "MMM d, h:mm a")}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
