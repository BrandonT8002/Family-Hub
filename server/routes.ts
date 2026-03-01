import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup MUST be before other routes
  await setupAuth(app);
  registerAuthRoutes(app);

  // Helper to ensure user has a family
  const requireFamily = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const family = await storage.getFamilyForUser(userId);
    if (!family) return res.status(400).json({ message: "No family found" });
    req.family = family;
    next();
  };

  app.get(api.family.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const family = await storage.getFamilyForUser(userId);
    res.json(family);
  });

  app.post(api.family.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.family.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const family = await storage.createFamily(input.name, userId);
      res.status(201).json(family);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.events.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const events = await storage.getEvents(req.family.id);
    res.json(events);
  });

  app.post(api.events.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.events.create.input.parse(req.body);
      const event = await storage.createEvent({
        ...input,
        date: new Date(input.date),
        familyId: req.family.id,
        creatorId: req.user.claims.sub,
      });
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.expenses.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const expenses = await storage.getExpenses(req.family.id);
    res.json(expenses);
  });

  app.post(api.expenses.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.expenses.create.input.parse(req.body);
      const expense = await storage.createExpense({
        ...input,
        amount: input.amount.toString(),
        familyId: req.family.id,
        creatorId: req.user.claims.sub,
      });
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.groceryLists.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const lists = await storage.getGroceryLists(req.family.id);
    res.json(lists);
  });

  app.post(api.groceryLists.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.groceryLists.create.input.parse(req.body);
      const list = await storage.createGroceryList({
        ...input,
        familyId: req.family.id,
      });
      res.status(201).json(list);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.groceryItems.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const items = await storage.getGroceryItems(Number(req.params.listId));
    res.json(items);
  });

  app.post(api.groceryItems.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.groceryItems.create.input.parse(req.body);
      const item = await storage.createGroceryItem({
        ...input,
        listId: Number(req.params.listId),
        price: input.price?.toString() || "0",
      });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.groceryItems.toggle.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.groceryItems.toggle.input.parse(req.body);
      const item = await storage.toggleGroceryItem(Number(req.params.id), input.isChecked);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.chat.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const msgs = await storage.getChatMessages(req.family.id);
    res.json(msgs);
  });

  app.post(api.chat.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.chat.create.input.parse(req.body);
      const msg = await storage.createChatMessage({
        content: input.content,
        familyId: req.family.id,
        senderId: req.user.claims.sub,
      });
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  return httpServer;
}
