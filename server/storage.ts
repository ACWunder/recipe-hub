import { type User, type InsertUser, type Recipe, type InsertRecipe, type Friendship, type SafeUser, users, recipes, friendships } from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, and, or, inArray, ne } from "drizzle-orm";

function toSafeUser(user: User): SafeUser {
  const { passwordHash, ...safe } = user;
  return safe;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  searchUsers(query: string, excludeUserId: string): Promise<SafeUser[]>;

  getAllRecipes(scope?: string, userId?: string, friendIds?: string[]): Promise<Recipe[]>;
  getRecentRecipes(limit: number, scope?: string, userId?: string, friendIds?: string[]): Promise<Recipe[]>;
  getRecipeById(id: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;

  sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship>;
  getIncomingRequests(userId: string): Promise<(Friendship & { requester: SafeUser })[]>;
  getOutgoingRequests(userId: string): Promise<(Friendship & { addressee: SafeUser })[]>;
  respondToFriendRequest(friendshipId: string, userId: string, accept: boolean): Promise<Friendship | undefined>;
  getFriends(userId: string): Promise<SafeUser[]>;
  getFriendIds(userId: string): Promise<string[]>;
  getFriendshipBetween(userId1: string, userId2: string): Promise<Friendship | undefined>;
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

  private applyScope(allRecipes: Recipe[], scope?: string, userId?: string, friendIds?: string[]): Recipe[] {
    if (!scope || scope === "all" || !userId) return allRecipes;
    if (scope === "mine") return allRecipes.filter(r => r.createdByUserId === userId);
    if (scope === "friends") {
      if (!friendIds || friendIds.length === 0) return [];
      return allRecipes.filter(r => r.createdByUserId && friendIds.includes(r.createdByUserId));
    }
    return allRecipes;
  }

  async getAllRecipes(scope?: string, userId?: string, friendIds?: string[]): Promise<Recipe[]> {
    const all = await db.select().from(recipes).orderBy(desc(recipes.createdAt));
    return this.applyScope(all, scope, userId, friendIds);
  }

  async getRecentRecipes(limit = 20, scope?: string, userId?: string, friendIds?: string[]): Promise<Recipe[]> {
    const all = await db.select().from(recipes).orderBy(desc(recipes.createdAt)).limit(100);
    const filtered = this.applyScope(all, scope, userId, friendIds);
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

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const [created] = await db.insert(friendships).values({ requesterId, addresseeId, status: "pending" }).returning();
    return created;
  }

  async getIncomingRequests(userId: string): Promise<(Friendship & { requester: SafeUser })[]> {
    const rows = await db.select().from(friendships)
      .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")));
    const result: (Friendship & { requester: SafeUser })[] = [];
    for (const row of rows) {
      const user = await this.getUser(row.requesterId);
      if (user) result.push({ ...row, requester: toSafeUser(user) });
    }
    return result;
  }

  async getOutgoingRequests(userId: string): Promise<(Friendship & { addressee: SafeUser })[]> {
    const rows = await db.select().from(friendships)
      .where(and(eq(friendships.requesterId, userId), eq(friendships.status, "pending")));
    const result: (Friendship & { addressee: SafeUser })[] = [];
    for (const row of rows) {
      const user = await this.getUser(row.addresseeId);
      if (user) result.push({ ...row, addressee: toSafeUser(user) });
    }
    return result;
  }

  async respondToFriendRequest(friendshipId: string, userId: string, accept: boolean): Promise<Friendship | undefined> {
    const [updated] = await db.update(friendships)
      .set({ status: accept ? "accepted" : "rejected" })
      .where(and(eq(friendships.id, friendshipId), eq(friendships.addresseeId, userId)))
      .returning();
    return updated;
  }

  async getFriends(userId: string): Promise<SafeUser[]> {
    const accepted = await db.select().from(friendships)
      .where(and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))
      ));
    const friendUserIds = accepted.map(f =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );
    if (friendUserIds.length === 0) return [];
    const friendUsers = await db.select().from(users).where(inArray(users.id, friendUserIds));
    return friendUsers.map(toSafeUser);
  }

  async getFriendIds(userId: string): Promise<string[]> {
    const accepted = await db.select().from(friendships)
      .where(and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))
      ));
    return accepted.map(f =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );
  }

  async getFriendshipBetween(userId1: string, userId2: string): Promise<Friendship | undefined> {
    const [existing] = await db.select().from(friendships)
      .where(or(
        and(eq(friendships.requesterId, userId1), eq(friendships.addresseeId, userId2)),
        and(eq(friendships.requesterId, userId2), eq(friendships.addresseeId, userId1))
      ));
    return existing;
  }
}

export const storage = new DatabaseStorage();
