import { z } from 'zod';
import { 
  families,
  events,
  expenses,
  groceryLists,
  groceryItems,
  chatMessages
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  family: {
    get: {
      method: 'GET' as const,
      path: '/api/family' as const,
      responses: {
        200: z.custom<typeof families.$inferSelect>().nullable(),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/family' as const,
      input: z.object({ name: z.string() }),
      responses: {
        201: z.custom<typeof families.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    }
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events' as const,
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events' as const,
      input: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.string(),
        isShared: z.boolean().optional().default(true),
      }),
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  expenses: {
    list: {
      method: 'GET' as const,
      path: '/api/expenses' as const,
      responses: {
        200: z.array(z.custom<typeof expenses.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/expenses' as const,
      input: z.object({
        amount: z.number().or(z.string()),
        category: z.string(),
        description: z.string(),
      }),
      responses: {
        201: z.custom<typeof expenses.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    }
  },
  groceryLists: {
    list: {
      method: 'GET' as const,
      path: '/api/grocery-lists' as const,
      responses: {
        200: z.array(z.custom<typeof groceryLists.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/grocery-lists' as const,
      input: z.object({ name: z.string(), type: z.string().optional().default("Needs") }),
      responses: {
        201: z.custom<typeof groceryLists.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    }
  },
  groceryItems: {
    list: {
      method: 'GET' as const,
      path: '/api/grocery-lists/:listId/items' as const,
      responses: {
        200: z.array(z.custom<typeof groceryItems.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/grocery-lists/:listId/items' as const,
      input: z.object({ name: z.string(), category: z.string(), price: z.number().or(z.string()).optional() }),
      responses: {
        201: z.custom<typeof groceryItems.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    toggle: {
      method: 'PATCH' as const,
      path: '/api/grocery-items/:id/toggle' as const,
      input: z.object({ isChecked: z.boolean() }),
      responses: {
        200: z.custom<typeof groceryItems.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  chat: {
    list: {
      method: 'GET' as const,
      path: '/api/chat' as const,
      responses: {
        200: z.array(z.custom<typeof chatMessages.$inferSelect & { user: { firstName: string | null, lastName: string | null, profileImageUrl: string | null } }>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/chat' as const,
      input: z.object({ content: z.string() }),
      responses: {
        201: z.custom<typeof chatMessages.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
