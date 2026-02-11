import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
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

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;
