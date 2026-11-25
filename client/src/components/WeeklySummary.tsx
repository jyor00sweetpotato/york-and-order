import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, differenceInCalendarDays, format, isSameDay, startOfDay, subDays } from "date-fns";
import { Loader2 } from "lucide-react";
import type { Todo } from "@shared/schema";
import { useCompletedTodos } from "@/hooks/use-todos";
import { TaskDetailDialog } from "@/components/TaskDetailDialog";
import { formatHours, impactLabel } from "@/lib/task-sizing";
import { cn } from "@/lib/utils";

// Stack order, bottom to top: High sits on the baseline, "Not set" rides on top.
// Greyscale ramp (validated for contrast and colorblind separation); "Not set" is striped.
const LEVELS = [
  { key: "high", label: "High", fill: "fill-walden-ink", swatch: "bg-walden-ink" },
  { key: "medium", label: "Medium", fill: "fill-walden-grey-700", swatch: "bg-walden-grey-700" },
  { key: "low", label: "Low", fill: "fill-walden-grey-400", swatch: "bg-walden-grey-400" },
  { key: null, label: "Not set", fill: "", swatch: "" },
] as const;
type Level = typeof LEVELS[number];

type Measure = "count" | "hours";

const HATCH_ID = "weekly-summary-not-set";
const HATCH_SWATCH =
  "bg-[repeating-linear-gradient(135deg,#a59f9e_0_2px,transparent_2px_4px)] ring-1 ring-inset ring-walden-grey-400";

const CHART_HEIGHT = 190;
const MARGIN = { top: 24, right: 4, bottom: 44, left: 30 };

function levelOf(todo: Todo): Level {
  return LEVELS.find((l) => l.key === (todo.strategicImpact ?? null)) ?? LEVELS[3];
}

function valueOf(todos: Todo[], level: Level, measure: Measure): number {
  const matching = todos.filter((t) => levelOf(t) === level);
  return measure === "count" ? matching.length : matching.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
}

function niceMax(v: number) {
  const step = v <= 4 ? 1 : v <= 8 ? 2 : v <= 15 ? 3 : 5;
  return { max: Math.max(step, Math.ceil(v / step) * step), step };
}

/** Column path with 4px rounded top corners and a square baseline. */
function barPath(x: number, yTop: number, w: number, h: number, r: number) {
  if (h <= 0) return "";
  r = Math.min(r, h, w / 2);
  const yB = yTop + h;
  return `M${x},${yB} L${x},${yTop + r} Q${x},${yTop} ${x + r},${yTop} L${x + w - r},${yTop} Q${x + w},${yTop} ${x + w},${yTop + r} L${x + w},${yB} Z`;
}

function signed(n: number) {
  const v = Math.round(n * 100) / 100;
  return `${v >= 0 ? "+" : "−"}${Math.abs(v)}`;
}

/** Last 7 days of completed tasks, by strategic impact. Shown on Charley's 1:1 page. */
export function WeeklySummary() {
  // Days are the viewer's local calendar days; the server only filters by instant.
  const today = startOfDay(new Date());
  const dayKey = today.getTime();
  const range = useMemo(
    () => ({ from: subDays(today, 13), to: addDays(today, 1) }),
    [dayKey],
  );
  const { data: completed, isLoading, error } = useCompletedTodos(range);

  const [measure, setMeasure] = useState<Measure>("count");
  const [view, setView] = useState<"chart" | "table">("chart");
  const [selected, setSelected] = useState(6);
  // Hovered column and the y of its stack top, so the tooltip can sit just above it.
  const [hovered, setHovered] = useState<{ index: number; top: number } | null>(null);
  const [openTodo, setOpenTodo] = useState<Todo | null>(null);

  const weekStart = subDays(today, 6);
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const todos = (completed ?? [])
        .filter((t) => t.completedAt && isSameDay(new Date(t.completedAt), date))
        .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
      return { date, todos };
    });
  }, [completed, dayKey]);

  const thisWeek = days.flatMap((d) => d.todos);
  const priorWeek = (completed ?? []).filter((t) => t.completedAt && new Date(t.completedAt) < weekStart);
  const hoursOf = (todos: Todo[]) => todos.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
  const highCount = thisWeek.filter((t) => t.strategicImpact === "high").length;
  const unestimated = thisWeek.filter((t) => t.estimatedHours == null).length;

  const unit = (v: number) => (measure === "count" ? String(v) : formatHours(v));
  const dayTotal = (todos: Todo[]) => LEVELS.reduce((sum, l) => sum + valueOf(todos, l, measure), 0);

  // Chart width follows the container.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [view, isLoading]);

  const selectedDay = days[selected];

  return (
    <section className="bg-card border border-border border-t-4 border-t-walden-sun p-5 md:p-6 space-y-5" data-testid="section-weekly-summary">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Last 7 days · {format(weekStart, "MMM d")} – {format(today, "MMM d")}
          </p>
          <h3 className="text-lg font-display mt-1">What I got done</h3>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground" data-testid="text-weekly-stats">
          <span>
            <strong className="text-base font-semibold text-foreground">{thisWeek.length}</strong> tasks completed
            {" "}({signed(thisWeek.length - priorWeek.length)} vs prior week)
          </span>
          <span>
            <strong className="text-base font-semibold text-foreground">{formatHours(hoursOf(thisWeek))}</strong> estimated
            {" "}({signed(hoursOf(thisWeek) - hoursOf(priorWeek))})
          </span>
          <span>
            <strong className="text-base font-semibold text-foreground">{highCount}</strong> high impact
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Segmented
            label="Measure"
            value={measure}
            onChange={setMeasure}
            options={[{ value: "count", label: "Tasks" }, { value: "hours", label: "Est. hours" }]}
          />
          <Segmented
            label="Show as"
            value={view}
            onChange={setView}
            options={[{ value: "chart", label: "Chart" }, { value: "table", label: "Table" }]}
          />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground md:ml-auto">
            {LEVELS.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5">
                <span className={cn("inline-block w-2.5 h-2.5", l.key ? l.swatch : HATCH_SWATCH)} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-walden-rust">Couldn't load completed tasks: {error.message}</p>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : view === "chart" ? (
        <div ref={wrapRef} className="relative min-w-0">
          <Chart
            width={width}
            days={days}
            measure={measure}
            selected={selected}
            today={today}
            onSelect={setSelected}
            onHover={setHovered}
            dayTotal={dayTotal}
            unit={unit}
          />
          {hovered !== null && (
            <Tooltip day={days[hovered.index]} index={hovered.index} top={hovered.top} width={width} measure={measure} dayTotal={dayTotal} unit={unit} />
          )}
          {measure === "hours" && unestimated > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {unestimated} task{unestimated === 1 ? " has" : "s have"} no estimate and add nothing to the hours view.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums" data-testid="table-weekly-summary">
            <thead>
              <tr className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <th className="text-left font-medium py-2 px-2">Day</th>
                {LEVELS.map((l) => <th key={l.label} className="text-right font-medium py-2 px-2">{l.label}</th>)}
                <th className="text-right font-medium py-2 px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => (
                <tr
                  key={i}
                  tabIndex={0}
                  onClick={() => setSelected(i)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(i); } }}
                  className={cn("cursor-pointer border-t border-walden-grey-100 hover:bg-walden-sun-wash", i === selected && "bg-walden-sun-wash")}
                >
                  <td className="py-2 px-2">{format(d.date, "EEEE, MMM d")}</td>
                  {LEVELS.map((l) => <td key={l.label} className="text-right py-2 px-2">{unit(valueOf(d.todos, l, measure))}</td>)}
                  <td className="text-right py-2 px-2 font-semibold">{unit(dayTotal(d.todos))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !error && (
        <div className="border-t border-border pt-4 space-y-3" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="text-base font-display">
              {isSameDay(selectedDay.date, today) ? `Today, ${format(selectedDay.date, "MMM d")}` : format(selectedDay.date, "EEEE, MMM d")}
            </h4>
            <span className="text-sm text-muted-foreground">
              {selectedDay.todos.length} completed
              {selectedDay.todos.length > 0 && ` · ${formatHours(hoursOf(selectedDay.todos))} est.`}
            </span>
          </div>

          {selectedDay.todos.length === 0 ? (
            <p className="text-sm text-muted-foreground border border-dashed border-border p-4 text-center">
              No tasks completed on {format(selectedDay.date, "EEEE, MMM d")}.
            </p>
          ) : (
            <ul className="divide-y divide-walden-grey-100">
              {selectedDay.todos.map((todo) => (
                <li key={todo.id}>
                  <CompletedRow todo={todo} onOpen={() => setOpenTodo(todo)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {openTodo && (
        <TaskDetailDialog
          todo={(completed ?? []).find((t) => t.id === openTodo.id) ?? openTodo}
          open
          onOpenChange={(open) => { if (!open) setOpenTodo(null); }}
        />
      )}
    </section>
  );
}

function Segmented<T extends string>({ label, value, onChange, options }: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex border border-foreground">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1 text-xs font-medium uppercase tracking-[0.08em]",
            value === o.value ? "bg-foreground text-background" : "hover:bg-walden-sun-wash",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

type Day = { date: Date; todos: Todo[] };

function Chart({ width, days, measure, selected, today, onSelect, onHover, dayTotal, unit }: {
  width: number;
  days: Day[];
  measure: Measure;
  selected: number;
  today: Date;
  onSelect: (i: number) => void;
  onHover: (hover: { index: number; top: number } | null) => void;
  dayTotal: (todos: Todo[]) => number;
  unit: (v: number) => string;
}) {
  const H = CHART_HEIGHT;
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = H - MARGIN.top - MARGIN.bottom;
  const { max, step } = niceMax(Math.max(...days.map((d) => dayTotal(d.todos))));
  const y = (v: number) => MARGIN.top + innerH - (v / max) * innerH;
  const band = innerW / days.length;
  const barW = Math.min(24, band * 0.5);
  const showDates = band >= 52;
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const colRefs = useRef<(SVGGElement | null)[]>([]);

  return (
    <svg
      width={width}
      height={H}
      viewBox={`0 0 ${width} ${H}`}
      className="block max-w-full overflow-visible font-sans tabular-nums"
      role="group"
      aria-label={`Tasks completed per day by strategic impact, ${measure === "count" ? "task count" : "estimated hours"}`}
    >
      <defs>
        <pattern id={HATCH_ID} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" className="stroke-walden-grey-400" strokeWidth="1.5" />
        </pattern>
      </defs>

      {ticks.map((v) => (
        <g key={v}>
          <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(v)} y2={y(v)} className={v === 0 ? "stroke-walden-line" : "stroke-walden-grey-100"} />
          <text x={MARGIN.left - 8} y={y(v) + 4} textAnchor="end" className="fill-walden-grey-500 text-[11px]">
            {measure === "count" ? v : `${v}h`}
          </text>
        </g>
      ))}

      {days.map((d, i) => {
        const cx = MARGIN.left + band * i + band / 2;
        const isToday = isSameDay(d.date, today);
        const total = dayTotal(d.todos);
        const segs = LEVELS.filter((l) => valueOf(d.todos, l, measure) > 0);
        let top = y(0);
        const paths = segs.map((l, si) => {
          const gap = si > 0 ? 2 : 0;
          const h = (valueOf(d.todos, l, measure) / max) * innerH - gap;
          const yTop = top - gap - h;
          top = yTop;
          return (
            <path
              key={l.label}
              d={barPath(cx - barW / 2, yTop, barW, h, si === segs.length - 1 ? 4 : 0)}
              className={l.key ? l.fill : undefined}
              fill={l.key ? undefined : `url(#${HATCH_ID})`}
            />
          );
        });

        const stackTop = (total > 0 ? top : y(0)) - 22; // above the total label

        return (
          <g
            key={i}
            ref={(el) => { colRefs.current[i] = el; }}
            tabIndex={0}
            role="button"
            aria-pressed={i === selected}
            aria-label={`${format(d.date, "EEEE, MMM d")}: ${unit(total)}; ${LEVELS.map((l) => `${l.label} ${unit(valueOf(d.todos, l, measure))}`).join(", ")}`}
            className="group cursor-pointer outline-none"
            onClick={() => onSelect(i)}
            onMouseEnter={() => onHover({ index: i, top: stackTop })}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover({ index: i, top: stackTop })}
            onBlur={() => onHover(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(i); }
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const next = Math.max(0, Math.min(days.length - 1, i + (e.key === "ArrowRight" ? 1 : -1)));
                onSelect(next);
                colRefs.current[next]?.focus();
              }
            }}
          >
            <rect
              x={cx - band / 2 + 3}
              y={MARGIN.top - 20}
              width={band - 6}
              height={innerH + 20 + MARGIN.bottom - 6}
              className={cn(
                "group-focus-visible:stroke-walden-ink",
                i === selected ? "fill-walden-sun-wash" : "fill-transparent group-hover:fill-walden-grey-100",
              )}
            />
            {paths}
            <text x={cx} y={(total > 0 ? top : y(0)) - 7} textAnchor="middle" className={total > 0 ? "fill-walden-ink text-[13px] font-medium" : "fill-walden-grey-500 text-xs"}>
              {unit(total)}
            </text>
            <text x={cx} y={H - MARGIN.bottom + 18} textAnchor="middle" className={cn("text-xs uppercase tracking-[0.06em]", i === selected || isToday ? "fill-walden-ink font-semibold" : "fill-walden-grey-700")}>
              {isToday ? "Today" : format(d.date, "EEE")}
            </text>
            {showDates && (
              <text x={cx} y={H - MARGIN.bottom + 33} textAnchor="middle" className="fill-walden-grey-500 text-[11px]">
                {format(d.date, "MMM d")}
              </text>
            )}
            {i === selected && <rect x={cx - 14} y={H - 6} width={28} height={3} className="fill-walden-sun" />}
          </g>
        );
      })}
    </svg>
  );
}

function Tooltip({ day, index, top, width, measure, dayTotal, unit }: {
  day: Day;
  index: number;
  top: number;
  width: number;
  measure: Measure;
  dayTotal: (todos: Todo[]) => number;
  unit: (v: number) => string;
}) {
  const band = (width - MARGIN.left - MARGIN.right) / 7;
  const cx = MARGIN.left + band * index + band / 2;
  const half = 90;
  const left = Math.max(half, Math.min(width - half, cx));
  return (
    <div
      className="pointer-events-none absolute z-10 w-[180px] -translate-x-1/2 -translate-y-full bg-walden-ink text-walden-paper text-xs px-3 py-2"
      style={{ left, top }}
      role="tooltip"
    >
      <div className="font-semibold mb-1">{format(day.date, "EEEE, MMM d")}</div>
      {LEVELS.map((l) => (
        <div key={l.label} className="flex justify-between gap-4 tabular-nums">
          <span>{l.label}</span>
          <span>{unit(valueOf(day.todos, l, measure))}</span>
        </div>
      ))}
      <div className="flex justify-between gap-4 mt-1 font-semibold tabular-nums">
        <span>Total</span>
        <span>{unit(dayTotal(day.todos))}</span>
      </div>
    </div>
  );
}

function CompletedRow({ todo, onOpen }: { todo: Todo; onOpen: () => void }) {
  const level = levelOf(todo);
  const completedAt = new Date(todo.completedAt!);
  const tookDays = differenceInCalendarDays(completedAt, new Date(todo.createdAt));
  const lateDays = todo.deadline ? differenceInCalendarDays(completedAt, new Date(todo.deadline)) : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid w-full grid-cols-[4px_minmax(0,1fr)_auto] items-stretch gap-3 py-3 px-1 text-left hover:bg-walden-sun-wash"
      data-testid={`row-completed-${todo.id}`}
    >
      <span aria-hidden className={cn("w-1", level.key ? level.swatch : HATCH_SWATCH)} />
      <span className="min-w-0 space-y-1">
        <span className="block font-display break-words">{todo.title}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {impactLabel(todo.strategicImpact) ? `${impactLabel(todo.strategicImpact)} impact` : "Impact not set"}
          </span>
          <span>{todo.category}</span>
          <span>Took {tookDays <= 0 ? "same day" : tookDays === 1 ? "1 day" : `${tookDays} days`}</span>
          {lateDays !== null && lateDays > 0 && (
            <span className="bg-walden-rust-wash text-walden-rust font-medium px-2">
              {lateDays} day{lateDays === 1 ? "" : "s"} late
            </span>
          )}
        </span>
      </span>
      <span className="flex items-center gap-3 text-sm text-muted-foreground whitespace-nowrap">
        <span className="font-medium text-foreground tabular-nums">
          {todo.estimatedHours != null ? formatHours(todo.estimatedHours) : "—"}
        </span>
        <span className="hidden sm:inline">{format(completedAt, "h:mm a")}</span>
      </span>
    </button>
  );
}
