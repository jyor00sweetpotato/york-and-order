import { Link, useLocation } from "wouter";
import { LayoutDashboard, CheckSquare, PieChart, Zap, Calendar, CalendarDays, CalendarRange, Clock, Inbox, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTodoCategories } from "@/hooks/use-settings";

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
  "red": "text-walden-rust",
  "orange": "text-walden-ink",
  "yellow": "text-walden-ink",
  "blue": "text-walden-ink",
  "purple": "text-walden-grey-700",
  "gray": "text-walden-grey-700",
  "green": "text-walden-ink",
};

interface SidebarProps {
  isMobile?: boolean;
}

export function Sidebar({ isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  const { data: categories } = useTodoCategories();

  const renderLink = (link: { href: string; label: string; icon: any; color?: string }) => {
    const Icon = link.icon;
    const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href + "/"));
    
    return (
      <Link key={link.href} href={link.href} data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, '-')}`} className={cn(
        "flex items-center gap-3 px-4 py-2.5 border-l-4 transition-all duration-200 group font-medium text-sm",
        isActive
          ? "border-walden-sun bg-walden-paper text-foreground"
          : "border-transparent text-muted-foreground hover:bg-walden-sun-wash hover:text-foreground"
      )}>
        <Icon className={cn(
          "w-4 h-4", 
          isActive ? "text-foreground" : link.color || "text-muted-foreground group-hover:text-foreground"
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
        <h1 className="text-2xl font-display text-foreground">
          Joe's List
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Walden to-do list management</p>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {mainLinks.map(renderLink)}
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
        <div className="p-3 border-l-4 border-walden-sun bg-walden-paper">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">Pro Tip</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use Settings to customize categories and manage your colleagues.
          </p>
        </div>
      </div>
    </div>
  );
}
