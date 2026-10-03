import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// TODOS
// =============================================================================

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("Today"),
  type: text("type").notNull().default("personal"),
  deadline: timestamp("deadline"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTodoSchema = createInsertSchema(todos, {
  description: z.string().min(1, "Description is required"),
  deadline: z.union([z.string(), z.date()]).optional().transform(val => 
    val ? (typeof val === 'string' ? new Date(val) : val) : undefined
  ),
}).omit({
  id: true,
  createdAt: true,
  completedAt: true
});

export type Todo = typeof todos.$inferSelect;
export type InsertTodo = z.infer<typeof insertTodoSchema>;

export type CreateTodoRequest = InsertTodo;
export type UpdateTodoRequest = Partial<InsertTodo>;

export type TodoStats = {
  totalCompleted: number;
  totalPending: number;
  personalCompleted: number;
  professionalCompleted: number;
  recentCompletions: Todo[];
  thisWeek: {
    total: number;
    personal: number;
    professional: number;
    avgCompletionTimeHours: number | null;
    personalAvgHours: number | null;
    professionalAvgHours: number | null;
  };
  thisMonth: {
    total: number;
    personal: number;
    professional: number;
    avgCompletionTimeHours: number | null;
    personalAvgHours: number | null;
    professionalAvgHours: number | null;
  };
  allTime: {
    total: number;
    personal: number;
    professional: number;
    avgCompletionTimeHours: number | null;
    personalAvgHours: number | null;
    professionalAvgHours: number | null;
  };
};

// =============================================================================
// COLLEAGUES (for 1:1 discussions)
// =============================================================================

export const colleagues = pgTable("colleagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertColleagueSchema = createInsertSchema(colleagues).omit({
  id: true,
  createdAt: true
});

export type Colleague = typeof colleagues.$inferSelect;
export type InsertColleague = z.infer<typeof insertColleagueSchema>;

// =============================================================================
// DISCUSSION ITEMS (for 1:1 meetings)
// =============================================================================

export const discussionItems = pgTable("discussion_items", {
  id: serial("id").primaryKey(),
  colleagueId: integer("colleague_id").notNull().references(() => colleagues.id),
  description: text("description").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("To Discuss"), // 'To Discuss' | 'Ongoing' | 'Discussed'
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  discussedAt: timestamp("discussed_at"),
});

export const insertDiscussionItemSchema = createInsertSchema(discussionItems, {
  dueDate: z.union([z.string(), z.date()]).optional().nullable().transform(val => 
    val ? (typeof val === 'string' ? new Date(val) : val) : null
  ),
}).omit({
  id: true,
  createdAt: true,
  discussedAt: true
});

export type DiscussionItem = typeof discussionItems.$inferSelect;
export type InsertDiscussionItem = z.infer<typeof insertDiscussionItemSchema>;

// =============================================================================
// SETTINGS (for dynamic dropdown values)
// =============================================================================

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  group: text("group").notNull(), // 'todo_category' | 'todo_type' | 'discussion_status'
  value: text("value").notNull(),
  label: text("label").notNull(),
  color: text("color"), // Optional color for display
  sortOrder: serial("sort_order"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  sortOrder: true
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// =============================================================================
// TASK RELATIONSHIPS
// =============================================================================

export const taskRelationships = pgTable("task_relationships", {
  id: serial("id").primaryKey(),
  sourceTaskId: integer("source_task_id").notNull().references(() => todos.id, { onDelete: 'cascade' }),
  targetTaskId: integer("target_task_id").notNull().references(() => todos.id, { onDelete: 'cascade' }),
  relationshipType: text("relationship_type").notNull(), // 'blocks' | 'blocked_by' | 'associated'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskRelationshipSchema = createInsertSchema(taskRelationships).omit({
  id: true,
  createdAt: true
});

export type TaskRelationship = typeof taskRelationships.$inferSelect;
export type InsertTaskRelationship = z.infer<typeof insertTaskRelationshipSchema>;

// =============================================================================
// TASK-DISCUSSION LINKS
// =============================================================================

export const taskDiscussionLinks = pgTable("task_discussion_links", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => todos.id, { onDelete: 'cascade' }),
  discussionItemId: integer("discussion_item_id").notNull().references(() => discussionItems.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskDiscussionLinkSchema = createInsertSchema(taskDiscussionLinks).omit({
  id: true,
  createdAt: true
});

export type TaskDiscussionLink = typeof taskDiscussionLinks.$inferSelect;
export type InsertTaskDiscussionLink = z.infer<typeof insertTaskDiscussionLinkSchema>;
