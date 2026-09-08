import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  quantity: numeric("quantity", { mode: "number" }).notNull().default(0),
  reorderAt: numeric("reorder_at", { mode: "number" }).notNull().default(0),
  cost: numeric("cost", { mode: "number" }).notNull(),
  // The price before the current one, so a jump in cost is easy to spot.
  previousCost: numeric("previous_cost", { mode: "number" }),
  status: text("status").notNull().default("healthy"),
  // How this ingredient is measured in a recipe, when it's different from
  // how it's bought. E.g. bought by the kg, used in a recipe by the cup.
  measureUnit: text("measure_unit"),
  // How many measureUnits fit in one purchase unit, e.g. 8 cups per kg.
  unitsPerMeasure: numeric("units_per_measure", { mode: "number" }),
  // Public URL of the photo in the ingredient-images Supabase bucket.
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;
