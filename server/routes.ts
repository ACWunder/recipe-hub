import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecipeSchema, signupSchema, loginSchema } from "@shared/schema";
import { ZodError } from "zod";
import { requireAuth } from "./auth";
import passport from "passport";
import bcrypt from "bcryptjs";
import { GoogleGenAI } from "@google/genai";

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

  app.post("/api/import-recipe", requireAuth, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ message: "A valid URL is required" });
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({ message: "Only HTTP/HTTPS URLs are supported" });
      }

      const hostname = parsedUrl.hostname.toLowerCase();
      const blockedPatterns = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.", "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31."];
      if (blockedPatterns.some(p => hostname === p || hostname.startsWith(p))) {
        return res.status(400).json({ message: "This URL is not allowed" });
      }

      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google API key is not configured" });
      }

      let html: string;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const fetchRes = await fetch(parsedUrl.toString(), {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Recipease/1.0)",
            "Accept": "text/html,application/xhtml+xml",
          },
        });
        clearTimeout(timeout);
        if (!fetchRes.ok) {
          return res.status(400).json({ message: `Could not fetch URL (HTTP ${fetchRes.status})` });
        }
        html = await fetchRes.text();
      } catch (fetchErr: any) {
        return res.status(400).json({ message: fetchErr?.name === "AbortError" ? "Request timed out" : "Could not fetch URL" });
      }

      let ogImage = "";
      const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      if (ogMatch) ogImage = ogMatch[1];

      let jsonLd = "";
      const ldMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (ldMatches) {
        for (const m of ldMatches) {
          const inner = m.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "");
          try {
            const parsed = JSON.parse(inner);
            const isRecipe = (obj: any) =>
              obj?.["@type"] === "Recipe" ||
              (Array.isArray(obj?.["@type"]) && obj["@type"].includes("Recipe"));
            if (isRecipe(parsed)) {
              jsonLd = inner;
              if (!ogImage && parsed.image) {
                ogImage = typeof parsed.image === "string" ? parsed.image : (Array.isArray(parsed.image) ? parsed.image[0] : parsed.image?.url || "");
              }
              break;
            }
            if (Array.isArray(parsed?.["@graph"])) {
              const recipe = parsed["@graph"].find(isRecipe);
              if (recipe) {
                jsonLd = JSON.stringify(recipe);
                if (!ogImage && recipe.image) {
                  ogImage = typeof recipe.image === "string" ? recipe.image : (Array.isArray(recipe.image) ? recipe.image[0] : recipe.image?.url || "");
                }
                break;
              }
            }
          } catch {}
        }
      }

      const textContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 6000);

      const prompt = `You extract recipe data from web page content. Return ONLY valid JSON with this exact schema:
{"title":"string","description":"string or null","tags":["string"],"ingredients":["string"],"steps":["string"]}
Rules: ingredients one item per entry no numbering, steps concise ordered one per entry, tags 3-8 lowercase short words. No extra text, no markdown, no code fences. Just the JSON object.

${jsonLd ? `Recipe JSON-LD:\n${jsonLd.slice(0, 3000)}\n\nPage text:\n${textContent.slice(0, 3000)}` : `Page text:\n${textContent}`}`;

      const ai = new GoogleGenAI({ apiKey });
      let response: any;
      const models = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];
      let lastErr: any;
      for (const model of models) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              maxOutputTokens: 1200,
              temperature: 0.1,
            },
          });
          break;
        } catch (modelErr: any) {
          lastErr = modelErr;
          if (modelErr?.status === 429) continue;
          throw modelErr;
        }
      }
      if (!response) throw lastErr;

      const raw = (response.text || "").trim();
      let recipeData: any;
      try {
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        recipeData = JSON.parse(cleaned);
      } catch {
        return res.status(500).json({ message: "Failed to parse recipe from page" });
      }

      const result = {
        title: typeof recipeData.title === "string" ? recipeData.title.slice(0, 200) : "",
        description: typeof recipeData.description === "string" ? recipeData.description.slice(0, 500) : null,
        imageUrl: ogImage || null,
        tags: Array.isArray(recipeData.tags) ? recipeData.tags.filter((t: any) => typeof t === "string").slice(0, 10) : [],
        ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients.filter((i: any) => typeof i === "string").slice(0, 50) : [],
        steps: Array.isArray(recipeData.steps) ? recipeData.steps.filter((s: any) => typeof s === "string").slice(0, 30) : [],
      };

      if (!result.title || result.ingredients.length === 0 || result.steps.length === 0) {
        return res.status(400).json({ message: "Could not extract a complete recipe from this page" });
      }

      res.json(result);
    } catch (err: any) {
      console.error("Import recipe error:", err);
      const msg = err?.message || "";
      if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
        return res.status(401).json({ message: "Google API key is invalid. Please update it in your secrets." });
      }
      if (msg.includes("RATE_LIMIT") || msg.includes("quota") || err?.status === 429) {
        return res.status(429).json({ message: "Rate limit reached. Please wait a moment and try again." });
      }
      if (msg.includes("SAFETY")) {
        return res.status(400).json({ message: "The content was blocked by safety filters. Try a different recipe URL." });
      }
      res.status(500).json({ message: "Failed to import recipe. Please try again." });
    }
  });

  return httpServer;
}
