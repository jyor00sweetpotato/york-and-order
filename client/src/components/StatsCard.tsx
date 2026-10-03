import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trend?: string;
  color?: "blue" | "green" | "purple" | "orange";
}

export function StatsCard({ title, value, icon, trend, color = "blue" }: StatsCardProps) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-xl border", colorStyles[color])}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-medium bg-secondary px-2 py-1 rounded-full text-muted-foreground">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold font-display text-foreground">{value}</h3>
      <p className="text-sm text-muted-foreground font-medium mt-1">{title}</p>
    </div>
  );
}
