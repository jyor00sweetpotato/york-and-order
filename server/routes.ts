import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// IDs are Postgres `serial` (int4) columns.
const MAX_PG_INT = 2147483647;

/**
 * Parses a route/query param into a positive integer for database lookups.
 * Sends a 400 response and returns null when the value is missing or not a
 * valid integer — this keeps malformed input (e.g. NaN from the frontend)
 * from ever reaching Postgres, where it would throw and could leak a
 * pooled connection on the error path.
 */
function parseIdParam(
  req: Request,
  res: Response,
  name: string,
  source: "params" | "query" = "params"
): number | null {
  const raw = source === "params" ? req.params[name] : req.query[name];
  // Plain decimal digits only — Number() alone would accept "1e3", "0x1A",
  // " 7 ", and values beyond int4 that Postgres would reject with a 500.
  const id = typeof raw === "string" && /^[1-9]\d*$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isInteger(id) || id > MAX_PG_INT) {
    res.status(400).json({ message: `Invalid ${name}` });
    return null;
  }
  return id;
}

/** Same as parseIdParam, but the param is optional — only validates when present. */
function parseOptionalIdParam(
  req: Request,
  res: Response,
  name: string
): number | undefined | null {
  if (req.query[name] === undefined) return undefined;
  return parseIdParam(req, res, name, "query");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // =============================================================================
  // STATS
  // =============================================================================
  app.get(api.stats.get.path, async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  // =============================================================================
  // TODOS
  // =============================================================================
  app.get(api.todos.list.path, async (req, res) => {
    const type = req.query.type as string | undefined;
    const category = req.query.category as string | undefined;
    const status = req.query.status as 'pending' | 'completed' | undefined;
    const todos = await storage.getTodos({ type, category, status });
    res.json(todos);
  });

  app.post(api.todos.create.path, async (req, res) => {
    try {
      const input = api.todos.create.input.parse(req.body);
      const todo = await storage.createTodo(input);
      res.status(201).json(todo);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.todos.get.path, async (req, res) => {
    const id = parseIdParam(req, res, 'id');
    if (id === null) return;
    const todo = await storage.getTodo(id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json(todo);
  });

  app.patch(api.todos.update.path, async (req, res) => {
    try {
      const input = api.todos.update.input.parse(req.body);
      const id = parseIdParam(req, res, 'id');
      if (id === null) return;
      const updated = await storage.updateTodo(id, input);
      if (!updated) {
        return res.status(404).json({ message: 'Todo not found' });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.todos.delete.path, async (req, res) => {
    const id = parseIdParam(req, res, 'id');
    if (id === null) return;
    await storage.deleteTodo(id);
    res.status(204).send();
  });

  // =============================================================================
  // COLLEAGUES
  // =============================================================================
  app.get(api.colleagues.list.path, async (req, res) => {
    const colleagues = await storage.getColleagues();
    res.json(colleagues);
  });

  app.post(api.colleagues.create.path, async (req, res) => {
    try {
      const input = api.colleagues.create.input.parse(req.body);
      const colleague = await storage.createColleague(input);
      res.status(201).json(colleague);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.colleagues.get.path, async (req, res) => {
    const id = parseIdParam(req, res, 'id');
    if (id === null) return;
    const colleague = await storage.getColleague(id);
    if (!colleague) {
      return res.status(404).json({ message: 'Colleague not found' });
    }
    res.json(colleague);
  });

  app.patch(api.colleagues.update.path, async (req, res) => {
    try {
      const input = api.colleagues.update.input.parse(req.body);
      const id = parseIdParam(req, res, 'id');
      if (id === null) return;
      const updated = await storage.updateColleague(id, input);
      if (!updated) {
        return res.status(404).json({ message: 'Colleague not found' });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.colleagues.delete.path, async (req, res) => {
    const id = parseIdParam(req, res, 'id');
    if (id === null) return;
    await storage.deleteColleague(id);
    res.status(204).send();
  });

  // =============================================================================
  // DISCUSSION ITEMS
  // =============================================================================
  app.get(api.discussionItems.list.path, async (req, res) => {
    const colleagueId = parseOptionalIdParam(req, res, 'colleagueId');
    if (colleagueId === null) return;
    const status = req.query.status as string | undefined;
    const archived = req.query.archived === 'true' ? true : req.query.archived === 'false' ? false : undefined;
    const items = await storage.getDiscussionItems({ colleagueId, status, archived });
    res.json(items);
  });

  app.post(api.discussionItems.create.path, async (req, res) => {
    try {
      const input = api.discussionItems.create.input.parse(req.body);
      const item = await storage.createDiscussionItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.discussionItems.get.path, async (req, res) => {
    const id = parseIdParam(req, res, 'id');
    if (id === null) return;
    const item = await storage.getDiscussionItem(id);
    if (!item) {
      return res.status(404).json({ message: 'Discussion item not found' });
    }
    res.json(item);
  });

  app.patch(api.discussionItems.update.path, async (req, res) => {
    try {
      const input = api.discussionItems.update.input.parse(req.body);
      const id = parseIdParam(req, res, 'id');
      if (id === null) return;
      const updated = await storage.updateDiscussionItem(id, input);
      if (!updated) {
        return res.status(404).json({ message: 'Discussion item not found' });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.discussionItems.delete.path, async (req, res) => {
    const id = parseIdParam(req, res, 'id');
    if (id === null) return;
    await storage.deleteDiscussionItem(id);
    res.status(204).send();
  });

  // =============================================================================
  // SETTINGS
  // =============================================================================
  app.get(api.settings.list.path, async (req, res) => {
    const group = req.query.group as string | undefined;
    const settings = await storage.getSettings(group);
    res.json(settings);
  });

  app.post(api.settings.create.path, async (req, res) => {
    try {
      const input = api.settings.create.input.parse(req.body);
      const setting = await storage.createSetting(input);
      res.status(201).json(setting);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.settings.delete.path, async (req, res) => {
    const id = parseIdParam(req, res, 'id');
    if (id === null) return;
    await storage.deleteSetting(id);
    res.status(204).send();
  });

  // =============================================================================
  // TASK RELATIONSHIPS
  // =============================================================================
  app.get(api.taskRelationships.list.path, async (req, res) => {
    const taskId = parseIdParam(req, res, 'taskId', 'query');
    if (taskId === null) return;
    const relationships = await storage.getTaskRelationships(taskId);
    res.json(relationships);
  });

  app.post(api.taskRelationships.create.path, async (req, res) => {
    try {
      const input = api.taskRelationships.create.input.parse(req.body);
      const relationship = await storage.createTaskRelationship(input);
      res.status(201).json(relationship);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.taskRelationships.delete.path, async (req, res) => {
    const id = parseIdParam(req, res, 'id');
    if (id === null) return;
    await storage.deleteTaskRelationship(id);
    res.status(204).send();
  });

  // =============================================================================
  // TASK-DISCUSSION LINKS
  // =============================================================================
  app.get(api.taskDiscussionLinks.list.path, async (req, res) => {
    const taskId = parseOptionalIdParam(req, res, 'taskId');
    if (taskId === null) return;
    const discussionItemId = parseOptionalIdParam(req, res, 'discussionItemId');
    if (discussionItemId === null) return;
    const links = await storage.getTaskDiscussionLinks(taskId, discussionItemId);
    res.json(links);
  });

  app.post(api.taskDiscussionLinks.create.path, async (req, res) => {
    try {
      const input = api.taskDiscussionLinks.create.input.parse(req.body);
      const link = await storage.createTaskDiscussionLink(input);
      res.status(201).json(link);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.taskDiscussionLinks.delete.path, async (req, res) => {
    const id = parseIdParam(req, res, 'id');
    if (id === null) return;
    await storage.deleteTaskDiscussionLink(id);
    res.status(204).send();
  });

  // Seed data if empty
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const stats = await storage.getStats();
  const existingSettings = await storage.getSettings();

  // Seed settings with defaults if empty
  if (existingSettings.length === 0) {
    // Todo categories
    const categories = [
      { group: 'todo_category', value: 'ASAP', label: 'ASAP', color: 'red' },
      { group: 'todo_category', value: 'Today', label: 'Today', color: 'orange' },
      { group: 'todo_category', value: 'This Week', label: 'This Week', color: 'yellow' },
      { group: 'todo_category', value: 'Next Week', label: 'Next Week', color: 'blue' },
      { group: 'todo_category', value: 'Eventually', label: 'Eventually', color: 'purple' },
      { group: 'todo_category', value: 'Parking Lot', label: 'Parking Lot', color: 'gray' },
    ];
    for (const cat of categories) {
      await storage.createSetting(cat);
    }

    // Todo types
    const types = [
      { group: 'todo_type', value: 'personal', label: 'Personal', color: 'purple' },
      { group: 'todo_type', value: 'professional', label: 'Professional', color: 'blue' },
    ];
    for (const type of types) {
      await storage.createSetting(type);
    }

    // Discussion statuses
    const statuses = [
      { group: 'discussion_status', value: 'To Discuss', label: 'To Discuss', color: 'blue' },
      { group: 'discussion_status', value: 'Ongoing', label: 'Ongoing', color: 'yellow' },
      { group: 'discussion_status', value: 'Discussed', label: 'Discussed', color: 'green' },
    ];
    for (const status of statuses) {
      await storage.createSetting(status);
    }
  }

  // Seed todos if empty
  if (stats.totalCompleted === 0 && stats.totalPending === 0) {
    await storage.createTodo({
      title: "Review project proposal",
      description: "Go through the new Q3 roadmap and provide feedback.",
      type: "professional",
      category: "Today",
      isCompleted: false,
      deadline: new Date(Date.now() + 86400000 * 2)
    });
    await storage.createTodo({
      title: "Buy groceries",
      description: "Milk, eggs, bread, and coffee.",
      type: "personal",
      category: "ASAP",
      isCompleted: false,
      deadline: new Date(Date.now() + 86400000)
    });
    await storage.createTodo({
      title: "Submit expense report",
      description: "For the last business trip.",
      type: "professional",
      category: "This Week",
      isCompleted: true,
    });
    await storage.createTodo({
      title: "Gym session",
      description: "Leg day.",
      type: "personal",
      category: "Today",
      isCompleted: true,
    });
    await storage.createTodo({
      title: "Learn a new programming language",
      description: "Maybe Rust or Go?",
      type: "personal",
      category: "Parking Lot",
      isCompleted: false,
    });
  }

  // Seed sample colleagues if none exist
  const existingColleagues = await storage.getColleagues();
  if (existingColleagues.length === 0) {
    await storage.createColleague({ name: "Nick" });
    await storage.createColleague({ name: "Christine" });
    await storage.createColleague({ name: "Aislinn" });
  }
}
