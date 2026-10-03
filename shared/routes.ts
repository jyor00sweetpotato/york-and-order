import { z } from 'zod';
import { insertTodoSchema, insertColleagueSchema, insertDiscussionItemSchema, insertSettingSchema, insertTaskRelationshipSchema, insertTaskDiscussionLinkSchema, todos, colleagues, discussionItems, settings, taskRelationships, taskDiscussionLinks } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // =============================================================================
  // TODOS
  // =============================================================================
  todos: {
    list: {
      method: 'GET' as const,
      path: '/api/todos',
      input: z.object({
        status: z.enum(['pending', 'completed']).optional(),
        type: z.string().optional(),
        category: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof todos.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/todos',
      input: insertTodoSchema,
      responses: {
        201: z.custom<typeof todos.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/todos/:id',
      responses: {
        200: z.custom<typeof todos.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/todos/:id',
      input: insertTodoSchema.partial(),
      responses: {
        200: z.custom<typeof todos.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/todos/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          totalCompleted: z.number(),
          totalPending: z.number(),
          personalCompleted: z.number(),
          professionalCompleted: z.number(),
          recentCompletions: z.array(z.custom<typeof todos.$inferSelect>()),
          thisWeek: z.object({
            total: z.number(),
            personal: z.number(),
            professional: z.number(),
            avgCompletionTimeHours: z.number().nullable(),
            personalAvgHours: z.number().nullable(),
            professionalAvgHours: z.number().nullable(),
          }),
          thisMonth: z.object({
            total: z.number(),
            personal: z.number(),
            professional: z.number(),
            avgCompletionTimeHours: z.number().nullable(),
            personalAvgHours: z.number().nullable(),
            professionalAvgHours: z.number().nullable(),
          }),
          allTime: z.object({
            total: z.number(),
            personal: z.number(),
            professional: z.number(),
            avgCompletionTimeHours: z.number().nullable(),
            personalAvgHours: z.number().nullable(),
            professionalAvgHours: z.number().nullable(),
          }),
        })
      }
    }
  },

  // =============================================================================
  // COLLEAGUES
  // =============================================================================
  colleagues: {
    list: {
      method: 'GET' as const,
      path: '/api/colleagues',
      responses: {
        200: z.array(z.custom<typeof colleagues.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/colleagues',
      input: insertColleagueSchema,
      responses: {
        201: z.custom<typeof colleagues.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/colleagues/:id',
      responses: {
        200: z.custom<typeof colleagues.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/colleagues/:id',
      input: insertColleagueSchema.partial(),
      responses: {
        200: z.custom<typeof colleagues.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/colleagues/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // =============================================================================
  // DISCUSSION ITEMS
  // =============================================================================
  discussionItems: {
    list: {
      method: 'GET' as const,
      path: '/api/discussion-items',
      input: z.object({
        colleagueId: z.number().optional(),
        status: z.string().optional(),
        archived: z.boolean().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof discussionItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/discussion-items',
      input: insertDiscussionItemSchema,
      responses: {
        201: z.custom<typeof discussionItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/discussion-items/:id',
      responses: {
        200: z.custom<typeof discussionItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/discussion-items/:id',
      input: insertDiscussionItemSchema.partial(),
      responses: {
        200: z.custom<typeof discussionItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/discussion-items/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // =============================================================================
  // SETTINGS (for dynamic dropdown values)
  // =============================================================================
  settings: {
    list: {
      method: 'GET' as const,
      path: '/api/settings',
      input: z.object({
        group: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof settings.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/settings',
      input: insertSettingSchema,
      responses: {
        201: z.custom<typeof settings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/settings/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // =============================================================================
  // TASK RELATIONSHIPS
  // =============================================================================
  taskRelationships: {
    list: {
      method: 'GET' as const,
      path: '/api/task-relationships',
      input: z.object({
        taskId: z.number(),
      }),
      responses: {
        200: z.array(z.custom<typeof taskRelationships.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/task-relationships',
      input: insertTaskRelationshipSchema,
      responses: {
        201: z.custom<typeof taskRelationships.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/task-relationships/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // =============================================================================
  // TASK-DISCUSSION LINKS
  // =============================================================================
  taskDiscussionLinks: {
    list: {
      method: 'GET' as const,
      path: '/api/task-discussion-links',
      input: z.object({
        taskId: z.number().optional(),
        discussionItemId: z.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof taskDiscussionLinks.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/task-discussion-links',
      input: insertTaskDiscussionLinkSchema,
      responses: {
        201: z.custom<typeof taskDiscussionLinks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/task-discussion-links/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        // Never build "/api/x/NaN" or "/api/x/undefined" — fail loudly at the
        // call site instead of sending a request the server must reject.
        if (key === 'id' && !(Number.isInteger(value) && (value as number) > 0)) {
          throw new Error(`buildUrl: invalid id ${String(value)} for ${path}`);
        }
        url = url.replace(`:${key}`, encodeURIComponent(String(value)));
      }
    });
  }
  if (/:\w+/.test(url)) {
    throw new Error(`buildUrl: missing param in ${url}`);
  }
  return url;
}
