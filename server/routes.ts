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
      let followingIds: string[] = [];
      const userId = req.user?.id;
      if (scope === "following" && userId) {
        followingIds = await storage.getFollowingIds(userId);
      }
      const allRecipes = await storage.getAllRecipes(scope, userId, followingIds);
      res.json(allRecipes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/recent", async (req, res) => {
    try {
      const scope = req.query.scope as string | undefined;
      let followingIds: string[] = [];
      const userId = req.user?.id;
      if (scope === "following" && userId) {
        followingIds = await storage.getFollowingIds(userId);
      }
      const recentRecipes = await storage.getRecentRecipes(20, scope, userId, followingIds);
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

  app.post("/api/follow", requireAuth, async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: "userId required" });
      if (userId === req.user!.id) return res.status(400).json({ message: "Cannot follow yourself" });
      const already = await storage.isFollowing(req.user!.id, userId);
      if (already) return res.status(400).json({ message: "Already following" });
      const follow = await storage.follow(req.user!.id, userId);
      res.status(201).json(follow);
    } catch (err) {
      res.status(500).json({ message: "Failed to follow" });
    }
  });

  app.post("/api/unfollow", requireAuth, async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: "userId required" });
      const removed = await storage.unfollow(req.user!.id, userId);
      if (!removed) return res.status(404).json({ message: "Not following this user" });
      res.json({ message: "Unfollowed" });
    } catch (err) {
      res.status(500).json({ message: "Failed to unfollow" });
    }
  });

  app.get("/api/following", requireAuth, async (req, res) => {
    try {
      const following = await storage.getFollowing(req.user!.id);
      res.json(following);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  return httpServer;
}
