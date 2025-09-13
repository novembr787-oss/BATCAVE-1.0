import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tasks table for productivity management
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  domain: text("domain").notNull(), // academic, fitness, creative, social, maintenance
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  estimatedHours: numeric("estimated_hours", { precision: 4, scale: 1 }).notNull().default("1.0"),
  actualHours: numeric("actual_hours", { precision: 4, scale: 1 }),
  xpReward: integer("xp_reward").notNull().default(0),
  euReward: integer("eu_reward").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  xpReward: true,
  euReward: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Secure update schema - excludes reward fields that must be server-controlled
export const updateTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  userId: true,
  xpReward: true,
  euReward: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Transform numeric fields from database strings to numbers
const numericFieldTransform = z.string().transform((val) => parseFloat(val));

// Client-side schema that validates input with proper data types (strings for dates)
export const clientTaskSchema = insertTaskSchema.extend({
  estimatedHours: z.number().min(0.5).max(24).multipleOf(0.5),
  dueDate: z.string().optional(),
}).omit({
  userId: true,
});

// Update schema for client with proper validation (strings for dates)
export const clientUpdateTaskSchema = updateTaskSchema.extend({
  actualHours: z.number().min(0.1).max(100).multipleOf(0.1).optional(),
  estimatedHours: z.number().min(0.5).max(24).multipleOf(0.5).optional(),
  dueDate: z.string().optional(),
}).omit({
  completedAt: true, // Server-controlled when completion happens
});

// Database response schema - transforms numeric strings to numbers for frontend consumption
export const taskResponseSchema = createInsertSchema(tasks).extend({
  estimatedHours: numericFieldTransform,
  actualHours: z.string().transform((val) => val ? parseFloat(val) : null).nullable(),
}).omit({});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type ClientTask = z.infer<typeof clientTaskSchema>;
export type ClientUpdateTask = z.infer<typeof clientUpdateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Events table for calendar module
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("personal"), // academic, fitness, creative, social, maintenance, personal, meeting
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  allDay: boolean("all_day").notNull().default(false),
  recurrence: text("recurrence"), // none, daily, weekly, monthly, yearly
  recurrenceEnd: timestamp("recurrence_end"),
  taskId: varchar("task_id"), // Link to associated task if applicable
  location: text("location"),
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateEventSchema = createInsertSchema(events).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Client-side schema for events with proper validation
export const clientEventSchema = insertEventSchema.extend({
  startTime: z.string(),
  endTime: z.string(),
  recurrenceEnd: z.string().optional(),
}).omit({
  userId: true,
});

export const clientUpdateEventSchema = updateEventSchema.extend({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  recurrenceEnd: z.string().optional(),
}).omit({
  completedAt: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type ClientEvent = z.infer<typeof clientEventSchema>;
export type ClientUpdateEvent = z.infer<typeof clientUpdateEventSchema>;
export type Event = typeof events.$inferSelect;
