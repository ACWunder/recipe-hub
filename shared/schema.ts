import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, unique, boolean } from "drizzle-orm/pg-core";
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
  isBase: boolean("is_base").notNull().default(false),
});

export const follows = pgTable("follows", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  followerUserId: varchar("follower_user_id", { length: 255 }).notNull(),
  followingUserId: varchar("following_user_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("follows_unique").on(table.followerUserId, table.followingUserId),
]);

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, createdAt: true, isBase: true });
export const updateRecipeSchema = insertRecipeSchema.pick({
  title: true,
  description: true,
  imageUrl: true,
  tags: true,
  ingredients: true,
  steps: true,
}).partial();

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
export type Follow = typeof follows.$inferSelect;

export type SafeUser = Omit<User, "passwordHash">;

export type RecipeWithAuthor = Recipe & { authorUsername: string | null };
