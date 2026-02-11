import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecipeSchema, signupSchema, loginSchema } from "@shared/schema";
import { ZodError } from "zod";
import { requireAuth } from "./auth";
import passport from "passport";
import bcrypt from "bcryptjs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);
      const existing = await storage.getUserByUsername(data.username);
      if (existing) return res.status(400).json({ message: "Username already taken" });
      const passwordHash = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        username: data.username,
        passwordHash,
        displayName: data.displayName || null,
      });
      req.login({ id: user.id, username: user.username, displayName: user.displayName }, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after signup" });
        res.status(201).json({ id: user.id, username: user.username, displayName: user.displayName });
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: err.errors.map(e => e.message).join(", ") });
      }
      res.status(500).json({ message: "Signup failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: err.errors.map(e => e.message).join(", ") });
      }
    }
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ id: user.id, username: user.username, displayName: user.displayName });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  app.get("/api/recipes", async (req, res) => {
    try {
      const scope = req.query.scope as string | undefined;
      let friendIds: string[] = [];
      const userId = req.user?.id;
      if (scope === "friends" && userId) {
        friendIds = await storage.getFriendIds(userId);
      }
      const allRecipes = await storage.getAllRecipes(scope, userId, friendIds);
      res.json(allRecipes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/recent", async (req, res) => {
    try {
      const scope = req.query.scope as string | undefined;
      let friendIds: string[] = [];
      const userId = req.user?.id;
      if (scope === "friends" && userId) {
        friendIds = await storage.getFriendIds(userId);
      }
      const recentRecipes = await storage.getRecentRecipes(20, scope, userId, friendIds);
      res.json(recentRecipes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch recent recipes" });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const recipe = await storage.getRecipeById(req.params.id);
      if (!recipe) return res.status(404).json({ message: "Recipe not found" });
      res.json(recipe);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", requireAuth, async (req, res) => {
    try {
      const data = insertRecipeSchema.parse({ ...req.body, createdByUserId: req.user!.id });
      const recipe = await storage.createRecipe(data);
      res.status(201).json(recipe);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: err.errors.map(e => e.message).join(", ") });
      }
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const q = (req.query.q as string) || "";
      if (q.length < 2) return res.json([]);
      const results = await storage.searchUsers(q, req.user!.id);
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.post("/api/friends/request", requireAuth, async (req, res) => {
    try {
      const { toUserId } = req.body;
      if (!toUserId) return res.status(400).json({ message: "toUserId required" });
      if (toUserId === req.user!.id) return res.status(400).json({ message: "Cannot friend yourself" });
      const existing = await storage.getFriendshipBetween(req.user!.id, toUserId);
      if (existing) {
        if (existing.status === "accepted") return res.status(400).json({ message: "Already friends" });
        if (existing.status === "pending") return res.status(400).json({ message: "Request already pending" });
        if (existing.status === "rejected") {
          return res.status(400).json({ message: "Request was previously declined" });
        }
      }
      const friendship = await storage.sendFriendRequest(req.user!.id, toUserId);
      res.status(201).json(friendship);
    } catch (err) {
      res.status(500).json({ message: "Failed to send request" });
    }
  });

  app.get("/api/friends/requests", requireAuth, async (req, res) => {
    try {
      const incoming = await storage.getIncomingRequests(req.user!.id);
      const outgoing = await storage.getOutgoingRequests(req.user!.id);
      res.json({ incoming, outgoing });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.post("/api/friends/requests/:id/respond", requireAuth, async (req, res) => {
    try {
      const { accept } = req.body;
      if (typeof accept !== "boolean") return res.status(400).json({ message: "accept must be boolean" });
      const result = await storage.respondToFriendRequest(req.params.id as string, req.user!.id, accept);
      if (!result) return res.status(404).json({ message: "Request not found" });
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to respond to request" });
    }
  });

  app.get("/api/friends", requireAuth, async (req, res) => {
    try {
      const friends = await storage.getFriends(req.user!.id);
      res.json(friends);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  return httpServer;
}
