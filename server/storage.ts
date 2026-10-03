import { 
  todos, type Todo, type InsertTodo, type CreateTodoRequest, type UpdateTodoRequest, type TodoStats,
  colleagues, type Colleague, type InsertColleague,
  discussionItems, type DiscussionItem, type InsertDiscussionItem,
  settings, type Setting, type InsertSetting,
  taskRelationships, type TaskRelationship, type InsertTaskRelationship,
  taskDiscussionLinks, type TaskDiscussionLink, type InsertTaskDiscussionLink
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ne, or } from "drizzle-orm";

export interface IStorage {
  // Todos
  getTodos(filters?: { status?: 'pending' | 'completed', type?: string, category?: string }): Promise<Todo[]>;
  getTodo(id: number): Promise<Todo | undefined>;
  createTodo(todo: CreateTodoRequest): Promise<Todo>;
  updateTodo(id: number, updates: UpdateTodoRequest): Promise<Todo | undefined>;
  deleteTodo(id: number): Promise<void>;
  getStats(): Promise<TodoStats>;

  // Colleagues
  getColleagues(): Promise<Colleague[]>;
  getColleague(id: number): Promise<Colleague | undefined>;
  createColleague(colleague: InsertColleague): Promise<Colleague>;
  updateColleague(id: number, updates: Partial<InsertColleague>): Promise<Colleague | undefined>;
  deleteColleague(id: number): Promise<void>;

  // Discussion Items
  getDiscussionItems(filters?: { colleagueId?: number, status?: string, archived?: boolean }): Promise<DiscussionItem[]>;
  getDiscussionItem(id: number): Promise<DiscussionItem | undefined>;
  createDiscussionItem(item: InsertDiscussionItem): Promise<DiscussionItem>;
  updateDiscussionItem(id: number, updates: Partial<InsertDiscussionItem>): Promise<DiscussionItem | undefined>;
  deleteDiscussionItem(id: number): Promise<void>;

  // Settings
  getSettings(group?: string): Promise<Setting[]>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  deleteSetting(id: number): Promise<void>;

  // Task Relationships
  getTaskRelationships(taskId: number): Promise<TaskRelationship[]>;
  createTaskRelationship(relationship: InsertTaskRelationship): Promise<TaskRelationship>;
  deleteTaskRelationship(id: number): Promise<void>;

  // Task-Discussion Links
  getTaskDiscussionLinks(taskId?: number, discussionItemId?: number): Promise<TaskDiscussionLink[]>;
  createTaskDiscussionLink(link: InsertTaskDiscussionLink): Promise<TaskDiscussionLink>;
  deleteTaskDiscussionLink(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // =============================================================================
  // TODOS
  // =============================================================================
  async getTodos(filters?: { status?: 'pending' | 'completed', type?: string, category?: string }): Promise<Todo[]> {
    let conditions = [];
    if (filters?.status === 'completed') {
      conditions.push(eq(todos.isCompleted, true));
    } else if (filters?.status === 'pending') {
      conditions.push(eq(todos.isCompleted, false));
    }

    if (filters?.type) {
      conditions.push(eq(todos.type, filters.type));
    }

    if (filters?.category) {
      conditions.push(eq(todos.category, filters.category));
    }

    if (conditions.length > 0) {
      return await db.select().from(todos).where(and(...conditions)).orderBy(desc(todos.createdAt));
    }

    return await db.select().from(todos).orderBy(desc(todos.createdAt));
  }

  async getTodo(id: number): Promise<Todo | undefined> {
    const [todo] = await db.select().from(todos).where(eq(todos.id, id));
    return todo;
  }

  async createTodo(insertTodo: CreateTodoRequest): Promise<Todo> {
    const [todo] = await db.insert(todos).values(insertTodo).returning();
    return todo;
  }

  async updateTodo(id: number, updates: UpdateTodoRequest): Promise<Todo | undefined> {
    const existing = await this.getTodo(id);
    if (!existing) return undefined;

    let completedAtUpdate = {};
    if (updates.isCompleted !== undefined) {
      completedAtUpdate = { completedAt: updates.isCompleted ? new Date() : null };
    }

    const [updated] = await db.update(todos)
      .set({ ...updates, ...completedAtUpdate })
      .where(eq(todos.id, id))
      .returning();
    return updated;
  }

  async deleteTodo(id: number): Promise<void> {
    await db.delete(todos).where(eq(todos.id, id));
  }

  async getStats(): Promise<TodoStats> {
    const allTodos = await db.select().from(todos);
    const completedTodos = allTodos.filter(t => t.isCompleted);
    const totalCompleted = completedTodos.length;
    const totalPending = allTodos.filter(t => !t.isCompleted).length;
    const personalCompleted = completedTodos.filter(t => t.type === 'personal').length;
    const professionalCompleted = completedTodos.filter(t => t.type === 'professional').length;
    const recentCompletions = completedTodos
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
      .slice(0, 5);

    // Calculate period boundaries
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Helper to calculate average completion time in hours
    const calcAvgHours = (items: Todo[]): number | null => {
      const withTimes = items.filter(t => t.completedAt && t.createdAt);
      if (withTimes.length === 0) return null;
      const totalHours = withTimes.reduce((sum, t) => {
        const diffMs = new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime();
        return sum + (diffMs / (1000 * 60 * 60));
      }, 0);
      return Math.round((totalHours / withTimes.length) * 10) / 10;
    };

    // Helper to get period stats
    const getPeriodStats = (since: Date | null) => {
      const filtered = since 
        ? completedTodos.filter(t => t.completedAt && new Date(t.completedAt) >= since)
        : completedTodos;
      const personal = filtered.filter(t => t.type === 'personal');
      const professional = filtered.filter(t => t.type === 'professional');
      return {
        total: filtered.length,
        personal: personal.length,
        professional: professional.length,
        avgCompletionTimeHours: calcAvgHours(filtered),
        personalAvgHours: calcAvgHours(personal),
        professionalAvgHours: calcAvgHours(professional),
      };
    };

    return {
      totalCompleted,
      totalPending,
      personalCompleted,
      professionalCompleted,
      recentCompletions,
      thisWeek: getPeriodStats(startOfWeek),
      thisMonth: getPeriodStats(startOfMonth),
      allTime: getPeriodStats(null),
    };
  }

  // =============================================================================
  // COLLEAGUES
  // =============================================================================
  async getColleagues(): Promise<Colleague[]> {
    return await db.select().from(colleagues).orderBy(colleagues.name);
  }

  async getColleague(id: number): Promise<Colleague | undefined> {
    const [colleague] = await db.select().from(colleagues).where(eq(colleagues.id, id));
    return colleague;
  }

  async createColleague(insertColleague: InsertColleague): Promise<Colleague> {
    const [colleague] = await db.insert(colleagues).values(insertColleague).returning();
    return colleague;
  }

  async updateColleague(id: number, updates: Partial<InsertColleague>): Promise<Colleague | undefined> {
    const existing = await this.getColleague(id);
    if (!existing) return undefined;

    const [updated] = await db.update(colleagues)
      .set(updates)
      .where(eq(colleagues.id, id))
      .returning();
    return updated;
  }

  async deleteColleague(id: number): Promise<void> {
    await db.delete(discussionItems).where(eq(discussionItems.colleagueId, id));
    await db.delete(colleagues).where(eq(colleagues.id, id));
  }

  // =============================================================================
  // DISCUSSION ITEMS
  // =============================================================================
  async getDiscussionItems(filters?: { colleagueId?: number, status?: string, archived?: boolean }): Promise<DiscussionItem[]> {
    let conditions = [];

    if (filters?.colleagueId) {
      conditions.push(eq(discussionItems.colleagueId, filters.colleagueId));
    }

    if (filters?.status) {
      conditions.push(eq(discussionItems.status, filters.status));
    }

    if (filters?.archived === true) {
      conditions.push(eq(discussionItems.status, 'Discussed'));
    } else if (filters?.archived === false) {
      conditions.push(ne(discussionItems.status, 'Discussed'));
    }

    if (conditions.length > 0) {
      return await db.select().from(discussionItems).where(and(...conditions)).orderBy(desc(discussionItems.createdAt));
    }

    return await db.select().from(discussionItems).orderBy(desc(discussionItems.createdAt));
  }

  async getDiscussionItem(id: number): Promise<DiscussionItem | undefined> {
    const [item] = await db.select().from(discussionItems).where(eq(discussionItems.id, id));
    return item;
  }

  async createDiscussionItem(insertItem: InsertDiscussionItem): Promise<DiscussionItem> {
    const [item] = await db.insert(discussionItems).values(insertItem).returning();
    return item;
  }

  async updateDiscussionItem(id: number, updates: Partial<InsertDiscussionItem>): Promise<DiscussionItem | undefined> {
    const existing = await this.getDiscussionItem(id);
    if (!existing) return undefined;

    let discussedAtUpdate = {};
    if (updates.status === 'Discussed') {
      discussedAtUpdate = { discussedAt: new Date() };
    }

    const [updated] = await db.update(discussionItems)
      .set({ ...updates, ...discussedAtUpdate })
      .where(eq(discussionItems.id, id))
      .returning();
    return updated;
  }

  async deleteDiscussionItem(id: number): Promise<void> {
    await db.delete(discussionItems).where(eq(discussionItems.id, id));
  }

  // =============================================================================
  // SETTINGS
  // =============================================================================
  async getSettings(group?: string): Promise<Setting[]> {
    if (group) {
      return await db.select().from(settings).where(eq(settings.group, group)).orderBy(settings.sortOrder);
    }
    return await db.select().from(settings).orderBy(settings.group, settings.sortOrder);
  }

  async createSetting(insertSetting: InsertSetting): Promise<Setting> {
    const [setting] = await db.insert(settings).values(insertSetting).returning();
    return setting;
  }

  async deleteSetting(id: number): Promise<void> {
    await db.delete(settings).where(eq(settings.id, id));
  }

  // =============================================================================
  // TASK RELATIONSHIPS
  // =============================================================================
  async getTaskRelationships(taskId: number): Promise<TaskRelationship[]> {
    return await db.select().from(taskRelationships)
      .where(or(
        eq(taskRelationships.sourceTaskId, taskId),
        eq(taskRelationships.targetTaskId, taskId)
      ))
      .orderBy(desc(taskRelationships.createdAt));
  }

  async createTaskRelationship(relationship: InsertTaskRelationship): Promise<TaskRelationship> {
    const [created] = await db.insert(taskRelationships).values(relationship).returning();
    return created;
  }

  async deleteTaskRelationship(id: number): Promise<void> {
    await db.delete(taskRelationships).where(eq(taskRelationships.id, id));
  }

  // =============================================================================
  // TASK-DISCUSSION LINKS
  // =============================================================================
  async getTaskDiscussionLinks(taskId?: number, discussionItemId?: number): Promise<TaskDiscussionLink[]> {
    let conditions = [];
    if (taskId) {
      conditions.push(eq(taskDiscussionLinks.taskId, taskId));
    }
    if (discussionItemId) {
      conditions.push(eq(taskDiscussionLinks.discussionItemId, discussionItemId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(taskDiscussionLinks)
        .where(and(...conditions))
        .orderBy(desc(taskDiscussionLinks.createdAt));
    }
    return await db.select().from(taskDiscussionLinks).orderBy(desc(taskDiscussionLinks.createdAt));
  }

  async createTaskDiscussionLink(link: InsertTaskDiscussionLink): Promise<TaskDiscussionLink> {
    const [created] = await db.insert(taskDiscussionLinks).values(link).returning();
    return created;
  }

  async deleteTaskDiscussionLink(id: number): Promise<void> {
    await db.delete(taskDiscussionLinks).where(eq(taskDiscussionLinks.id, id));
  }
}

export const storage = new DatabaseStorage();
