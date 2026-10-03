import { Link, useLocation } from "wouter";
import { LayoutDashboard, CheckSquare, Briefcase, User, PieChart, Zap, Calendar, CalendarDays, CalendarRange, Clock, Inbox, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTodoCategories, useTodoTypes } from "@/hooks/use-settings";

const mainLinks = [
  { href: "/", label: "To Do List", icon: LayoutDashboard },
  { href: "/one-on-ones", label: "1:1 Agendas", icon: Users },
];

const otherLinks = [
  { href: "/completed", label: "Completed", icon: CheckSquare },
  { href: "/reports", label: "Reports", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

const categoryIcons: Record<string, any> = {
  "ASAP": Zap,
  "Today": Calendar,
  "This Week": CalendarDays,
  "Next Week": CalendarRange,
  "Eventually": Clock,
  "Parking Lot": Inbox,
};

const categoryColors: Record<string, string> = {
  "red": "text-red-500",
  "orange": "text-orange-500",
  "yellow": "text-yellow-600",
  "blue": "text-blue-500",
  "purple": "text-purple-500",
  "gray": "text-gray-500",
  "green": "text-green-500",
};

const typeIcons: Record<string, any> = {
  "personal": User,
  "professional": Briefcase,
};

interface SidebarProps {
  isMobile?: boolean;
}

export function Sidebar({ isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  const { data: categories } = useTodoCategories();
  const { data: types } = useTodoTypes();

  const renderLink = (link: { href: string; label: string; icon: any; color?: string }) => {
    const Icon = link.icon;
    const isActive = location === link.href;
    
    return (
      <Link key={link.href} href={link.href} data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, '-')}`} className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group font-medium text-sm",
        isActive 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}>
        <Icon className={cn(
          "w-4 h-4", 
          isActive ? "text-primary-foreground" : link.color || "text-muted-foreground group-hover:text-foreground"
        )} />
        {link.label}
      </Link>
    );
  };

  return (
    <div className={cn(
      "w-64 h-screen bg-card border-r border-border flex flex-col sticky top-0 left-0 z-50",
      !isMobile && "hidden md:flex"
    )}>
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-700">
          York & Order
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Life, organized.</p>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {mainLinks.map(renderLink)}
        </div>

        <div className="pt-4">
          <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</p>
          <div className="space-y-1">
            {types?.map((type) => {
              const Icon = typeIcons[type.value] || User;
              const colorClass = categoryColors[type.color || 'gray'];
              return renderLink({
                href: `/type/${type.value}`,
                label: type.label,
                icon: Icon,
                color: colorClass,
              });
            })}
          </div>
        </div>

        <div className="pt-4">
          <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</p>
          <div className="space-y-1">
            {categories?.map((cat) => {
              const Icon = categoryIcons[cat.value] || Calendar;
              const colorClass = categoryColors[cat.color || 'gray'];
              return renderLink({
                href: `/category/${cat.value}`,
                label: cat.label,
                icon: Icon,
                color: colorClass,
              });
            })}
          </div>
        </div>

        <div className="pt-4">
          <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">More</p>
          <div className="space-y-1">
            {otherLinks.map(renderLink)}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-xl p-3 border border-primary/10">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Pro Tip</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use Settings to customize categories and manage your colleagues.
          </p>
        </div>
      </div>
    </div>
  );
}
