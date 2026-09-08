import { pgTable, serial, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";

export type OrderLineItem = { label: string; amount: number };

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  eventDate: text("event_date"),
  fulfillment: text("fulfillment").notNull(),
  address: text("address"),
  notes: text("notes"),
  channel: text("channel").notNull(),
  lineItems: jsonb("line_items").$type<OrderLineItem[]>().notNull(),
  subtotal: numeric("subtotal", { mode: "number" }).notNull(),
  serviceFee: numeric("service_fee", { mode: "number" }).notNull(),
  total: numeric("total", { mode: "number" }).notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
