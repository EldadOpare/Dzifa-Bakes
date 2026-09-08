import { pgTable, serial, text, date, timestamp } from "drizzle-orm/pg-core";

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("operational"),
  nextService: date("next_service"),
  // Public URL of the photo in the ingredient-images Supabase bucket.
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;
