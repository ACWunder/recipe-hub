import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecipeSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/recipes", async (_req, res) => {
    try {
      const recipes = await storage.getAllRecipes();
      res.json(recipes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/recent", async (_req, res) => {
    try {
      const recipes = await storage.getRecentRecipes(20);
      res.json(recipes);
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

  app.post("/api/recipes", async (req, res) => {
    try {
      const data = insertRecipeSchema.parse(req.body);
      const recipe = await storage.createRecipe(data);
      res.status(201).json(recipe);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: err.errors.map(e => e.message).join(", ") });
      }
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  return httpServer;
}
