import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, portfolio } from "@workspace/db";
import { requireAuth } from "../middleware/require-auth";
import {
  CreatePortfolioItemBody,
  CreatePortfolioItemResponse,
  ListPortfolioResponse,
  UpdatePortfolioItemBody,
  UpdatePortfolioItemResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Public: this is what the storefront's /portfolio page reads.
// FIFO order: the first piece of work added is the first one shown.
router.get("/bakery/portfolio", async (_req, res) => {
  const items = await db.select().from(portfolio).orderBy(asc(portfolio.createdAt));
  res.json(ListPortfolioResponse.parse(items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))));
});

router.post("/bakery/portfolio", requireAuth, async (req, res) => {
  const input = CreatePortfolioItemBody.parse(req.body);
  const [item] = await db.insert(portfolio).values(input).returning();
  res.status(201).json(CreatePortfolioItemResponse.parse({ ...item, createdAt: item.createdAt.toISOString() }));
});

router.patch("/bakery/portfolio/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const input = UpdatePortfolioItemBody.parse(req.body);
  const [item] = await db.update(portfolio).set(input).where(eq(portfolio.id, id)).returning();
  if (!item) {
    res.status(404).json({ message: "Portfolio entry not found" });
    return;
  }
  res.json(UpdatePortfolioItemResponse.parse({ ...item, createdAt: item.createdAt.toISOString() }));
});

router.delete("/bakery/portfolio/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(portfolio).where(eq(portfolio.id, id));
  res.status(204).end();
});

export default router;
