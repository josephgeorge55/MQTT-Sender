import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// MQTT Message schema for frontend use
export const mqttMessageSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  message: z.string().min(1, "Message is required"),
});

export type MqttMessage = z.infer<typeof mqttMessageSchema>;

// Message log entry for UI
export interface MessageLogEntry {
  id: string;
  topic: string;
  message: string;
  timestamp: Date;
  status: 'sent' | 'error';
}

// MQTT connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
