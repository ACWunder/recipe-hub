import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
});

export const recipes = pgTable("recipes", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  ingredients: text("ingredients").array().notNull().default(sql`'{}'::text[]`),
  steps: text("steps").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdByUserId: varchar("created_by_user_id", { length: 255 }),
});

export const friendships = pgTable("friendships", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id", { length: 255 }).notNull(),
  addresseeId: varchar("addressee_id", { length: 255 }).notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, createdAt: true });
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true, status: true });

export const signupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6).max(100),
  displayName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;

export type SafeUser = Omit<User, "passwordHash">;
