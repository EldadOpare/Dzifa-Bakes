import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const portfolio = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  caption: text("caption"),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PortfolioEntry = typeof portfolio.$inferSelect;
export type NewPortfolioEntry = typeof portfolio.$inferInsert;
