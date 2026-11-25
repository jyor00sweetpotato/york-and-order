import type { Control } from "react-hook-form";
import { STRATEGIC_IMPACTS } from "@shared/schema";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { IMPACT_LABELS } from "@/lib/task-sizing";

// Radix Select can't hold an empty-string value, so "not set" travels as this sentinel.
const NOT_SET = "none";

/** Optional Strategic Impact + Estimated Hours fields, shared by the create and edit task forms. */
export function TaskSizingFields({ control }: { control: Control<any> }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={control}
        name="strategicImpact"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold">
              Strategic impact <span className="font-normal text-muted-foreground">(optional)</span>
            </FormLabel>
            <Select
              value={field.value ?? NOT_SET}
              onValueChange={(v) => field.onChange(v === NOT_SET ? null : v)}
            >
              <FormControl>
                <SelectTrigger data-testid="select-strategic-impact" className="rounded-xl bg-secondary border-transparent">
                  <SelectValue placeholder="Not set" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NOT_SET}>Not set</SelectItem>
                {STRATEGIC_IMPACTS.map((impact) => (
                  <SelectItem key={impact} value={impact}>{IMPACT_LABELS[impact]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="estimatedHours"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold">
              Estimated hours <span className="font-normal text-muted-foreground">(optional)</span>
            </FormLabel>
            <FormControl>
              <Input
                data-testid="input-estimated-hours"
                type="number"
                inputMode="decimal"
                min={0.25}
                max={999}
                step={0.25}
                placeholder="e.g. 2.5"
                className="rounded-xl bg-secondary border-transparent"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.valueAsNumber)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
