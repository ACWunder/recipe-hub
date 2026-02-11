import { type User, type InsertUser, type Recipe, type InsertRecipe, users, recipes } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllRecipes(): Promise<Recipe[]>;
  getRecentRecipes(limit?: number): Promise<Recipe[]>;
  getRecipeById(id: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getAllRecipes(): Promise<Recipe[]> {
    return db.select().from(recipes).orderBy(desc(recipes.createdAt));
  }

  async getRecentRecipes(limit = 20): Promise<Recipe[]> {
    return db.select().from(recipes).orderBy(desc(recipes.createdAt)).limit(limit);
  }

  async getRecipeById(id: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [created] = await db.insert(recipes).values(recipe).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
