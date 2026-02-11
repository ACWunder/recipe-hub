import { type User, type InsertUser, type Recipe, type InsertRecipe, type Follow, type SafeUser, type RecipeWithAuthor, users, recipes, follows } from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, and, ne, inArray } from "drizzle-orm";

function toSafeUser(user: User): SafeUser {
  const { passwordHash, ...safe } = user;
  return safe;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  searchUsers(query: string, excludeUserId: string): Promise<SafeUser[]>;

  getAllRecipes(scope?: string, userId?: string, followingIds?: string[]): Promise<RecipeWithAuthor[]>;
  getRecentRecipes(limit: number, scope?: string, userId?: string, followingIds?: string[]): Promise<RecipeWithAuthor[]>;
  getRecipeById(id: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  deleteRecipe(id: string): Promise<boolean>;

  follow(followerUserId: string, followingUserId: string): Promise<Follow>;
  unfollow(followerUserId: string, followingUserId: string): Promise<boolean>;
  getFollowing(userId: string): Promise<SafeUser[]>;
  getFollowingIds(userId: string): Promise<string[]>;
  isFollowing(followerUserId: string, followingUserId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async searchUsers(query: string, excludeUserId: string): Promise<SafeUser[]> {
    const results = await db.select().from(users)
      .where(and(ilike(users.username, `%${query}%`), ne(users.id, excludeUserId)))
      .limit(20);
    return results.map(toSafeUser);
  }

  private async fetchRecipesWithAuthor(): Promise<RecipeWithAuthor[]> {
    const rows = await db
      .select({
        recipe: recipes,
        authorUsername: users.username,
      })
      .from(recipes)
      .leftJoin(users, eq(recipes.createdByUserId, users.id))
      .orderBy(desc(recipes.createdAt));

    return rows.map(r => ({
      ...r.recipe,
      authorUsername: r.authorUsername || null,
    }));
  }

  private applyScope(allRecipes: RecipeWithAuthor[], scope?: string, userId?: string, followingIds?: string[]): RecipeWithAuthor[] {
    if (!scope || scope === "all") return allRecipes;
    if (scope === "base") return allRecipes.filter(r => r.isBase);
    if (!userId) return allRecipes;
    if (scope === "mine") return allRecipes.filter(r => r.createdByUserId === userId);
    if (scope === "following") {
      if (!followingIds || followingIds.length === 0) return [];
      return allRecipes.filter(r => r.createdByUserId && followingIds.includes(r.createdByUserId));
    }
    return allRecipes;
  }

  async getAllRecipes(scope?: string, userId?: string, followingIds?: string[]): Promise<RecipeWithAuthor[]> {
    const all = await this.fetchRecipesWithAuthor();
    return this.applyScope(all, scope, userId, followingIds);
  }

  async getRecentRecipes(limit = 20, scope?: string, userId?: string, followingIds?: string[]): Promise<RecipeWithAuthor[]> {
    const all = await this.fetchRecipesWithAuthor();
    const filtered = this.applyScope(all, scope, userId, followingIds);
    return filtered.slice(0, limit);
  }

  async getRecipeById(id: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [created] = await db.insert(recipes).values(recipe).returning();
    return created;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id)).returning();
    return result.length > 0;
  }

  async follow(followerUserId: string, followingUserId: string): Promise<Follow> {
    const [created] = await db.insert(follows)
      .values({ followerUserId, followingUserId })
      .returning();
    return created;
  }

  async unfollow(followerUserId: string, followingUserId: string): Promise<boolean> {
    const result = await db.delete(follows)
      .where(and(eq(follows.followerUserId, followerUserId), eq(follows.followingUserId, followingUserId)))
      .returning();
    return result.length > 0;
  }

  async getFollowing(userId: string): Promise<SafeUser[]> {
    const rows = await db.select().from(follows).where(eq(follows.followerUserId, userId));
    const followingUserIds = rows.map(r => r.followingUserId);
    if (followingUserIds.length === 0) return [];
    const followedUsers = await db.select().from(users).where(inArray(users.id, followingUserIds));
    return followedUsers.map(toSafeUser);
  }

  async getFollowingIds(userId: string): Promise<string[]> {
    const rows = await db.select().from(follows).where(eq(follows.followerUserId, userId));
    return rows.map(r => r.followingUserId);
  }

  async isFollowing(followerUserId: string, followingUserId: string): Promise<boolean> {
    const [row] = await db.select().from(follows)
      .where(and(eq(follows.followerUserId, followerUserId), eq(follows.followingUserId, followingUserId)));
    return !!row;
  }
}

export const storage = new DatabaseStorage();
