import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, inventory, equipment, orders } from "@workspace/db";
import { requireAuth } from "../middleware/require-auth";
import {
  CalculateCakeQuoteBody,
  CalculateCakeQuoteResponse,
  CreateEquipmentBody,
  CreateEquipmentResponse,
  CreateInventoryBody,
  CreateInventoryResponse,
  CreateOrderBody,
  CreateOrderResponse,
  GetBakerySummaryResponse,
  ListEquipmentResponse,
  ListInventoryResponse,
  ListOrdersResponse,
  UpdateEquipmentBody,
  UpdateEquipmentResponse,
  UpdateInventoryBody,
  UpdateInventoryResponse,
  UpdateOrderStatusBody,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// reorderAt of 0 means no threshold has been set yet, not "warn at zero".
const isLowStock = (quantity: number, reorderAt: number) => reorderAt > 0 && quantity <= reorderAt;

router.get("/bakery/summary", requireAuth, async (_req, res) => {
  const items = await db.select().from(inventory);
  const openOrders = (await db.select().from(orders)).filter((order) => order.status !== "completed" && order.status !== "cancelled").length;
  const lowStockCount = items.filter((item) => isLowStock(item.quantity, item.reorderAt)).length;
  const inventoryValue = Math.round(items.reduce((sum, item) => sum + item.quantity * item.cost, 0));
  const data = GetBakerySummaryResponse.parse({
    revenue: 18420,
    openOrders,
    lowStockCount,
    inventoryValue,
    weeklyRevenue: [
      { day: "Mon", value: 2100 },
      { day: "Tue", value: 2640 },
      { day: "Wed", value: 1980 },
      { day: "Thu", value: 3220 },
      { day: "Fri", value: 2880 },
      { day: "Sat", value: 4100 },
      { day: "Sun", value: 1500 },
    ],
  });
  res.json(data);
});

router.get("/bakery/inventory", requireAuth, async (_req, res) => {
  const items = await db.select().from(inventory).orderBy(inventory.name);
  res.json(ListInventoryResponse.parse(items));
});

router.post("/bakery/inventory", requireAuth, async (req, res) => {
  const input = CreateInventoryBody.parse(req.body);
  const status = isLowStock(input.quantity, input.reorderAt) ? "low" : "healthy";
  const [item] = await db.insert(inventory).values({ ...input, status }).returning();
  res.status(201).json(CreateInventoryResponse.parse(item));
});

router.patch("/bakery/inventory/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const input = UpdateInventoryBody.parse(req.body);
  const [current] = await db.select().from(inventory).where(eq(inventory.id, id));
  if (!current) {
    res.status(404).json({ message: "Inventory item not found" });
    return;
  }
  const next = { ...current, ...input };
  const [item] = await db
    .update(inventory)
    .set({
      ...input,
      // Keep the last price around, so a price jump is easy to spot.
      previousCost: input.cost !== undefined && input.cost !== current.cost ? current.cost : current.previousCost,
      status: isLowStock(next.quantity, next.reorderAt) ? "low" : "healthy",
    })
    .where(eq(inventory.id, id))
    .returning();
  res.json(UpdateInventoryResponse.parse(item));
});

router.delete("/bakery/inventory/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(inventory).where(eq(inventory.id, id));
  res.status(204).end();
});

router.get("/bakery/equipment", requireAuth, async (_req, res) => {
  const items = await db.select().from(equipment);
  res.json(
    ListEquipmentResponse.parse(
      items.map((item) => ({ ...item, nextService: item.nextService ?? "—" })),
    ),
  );
});

router.post("/bakery/equipment", requireAuth, async (req, res) => {
  const input = CreateEquipmentBody.parse(req.body);
  const [item] = await db.insert(equipment).values(input).returning();
  res.status(201).json(CreateEquipmentResponse.parse({ ...item, nextService: item.nextService ?? "—" }));
});

router.patch("/bakery/equipment/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const input = UpdateEquipmentBody.parse(req.body);
  const [item] = await db.update(equipment).set(input).where(eq(equipment.id, id)).returning();
  if (!item) {
    res.status(404).json({ message: "Equipment item not found" });
    return;
  }
  res.json(UpdateEquipmentResponse.parse({ ...item, nextService: item.nextService ?? "—" }));
});

router.delete("/bakery/equipment/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(equipment).where(eq(equipment.id, id));
  res.status(204).end();
});

router.get("/bakery/orders", requireAuth, async (_req, res) => {
  const items = await db.select().from(orders).orderBy(desc(orders.createdAt));
  res.json(ListOrdersResponse.parse(items.map((order) => ({ ...order, createdAt: order.createdAt.toISOString() }))));
});

router.post("/bakery/orders", async (req, res) => {
  const input = CreateOrderBody.parse(req.body);
  const [order] = await db.insert(orders).values(input).returning();
  res.status(201).json(CreateOrderResponse.parse({ ...order, createdAt: order.createdAt.toISOString() }));
});

router.patch("/bakery/orders/:id/status", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const input = UpdateOrderStatusBody.parse(req.body);
  const [order] = await db.update(orders).set({ status: input.status }).where(eq(orders.id, id)).returning();
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  res.json(UpdateOrderStatusResponse.parse({ ...order, createdAt: order.createdAt.toISOString() }));
});

router.delete("/bakery/orders/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(orders).where(eq(orders.id, id));
  res.status(204).end();
});

router.post("/bakery/quote", (req, res) => {
  const input = CalculateCakeQuoteBody.parse(req.body);
  const sizeBase: Record<string, number> = { "6 inch": 420, "8 inch": 620, "10 inch": 840, "12 inch": 1120 };
  const flavourPrice: Record<string, number> = { Vanilla: 0, Chocolate: 70, "Red velvet": 90, "Lemon elderflower": 120 };
  const frostingPrice: Record<string, number> = { "Swiss meringue": 0, "Cream cheese": 45, "Whipped ganache": 85, "Buttercream": 25 };
  const topperPrice: Record<string, number> = { None: 0, "Fresh florals": 120, "Sugar inscription": 80, "Acrylic name": 150 };
  const dripPrice: Record<string, number> = { None: 0, Chocolate: 55, Caramel: 65, "Gold shimmer": 95 };

  const base = sizeBase[input.size] ?? 620;
  const layer = Math.max(0, input.layers - 2) * 110;
  const tier = Math.max(0, input.tiers - 1) * 380;
  const lines = [
    { label: `${input.size} base`, amount: base },
    { label: `${input.layers} layers`, amount: layer },
    { label: `${input.tiers} ${input.tiers === 1 ? "tier" : "tiers"}`, amount: tier },
    { label: `${input.flavour} sponge`, amount: flavourPrice[input.flavour] ?? 0 },
    { label: `${input.frosting} finish`, amount: frostingPrice[input.frosting] ?? 0 },
    { label: input.topper, amount: topperPrice[input.topper] ?? 0 },
    { label: input.drip === "None" ? "No drip" : `${input.drip} drip`, amount: dripPrice[input.drip] ?? 0 },
    ...(input.equipment.includes("Rush finish") ? [{ label: "Rush finish", amount: 220 }] : []),
  ].filter((line) => line.amount > 0);
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const serviceFee = Math.round(subtotal * 0.08);
  res.json(CalculateCakeQuoteResponse.parse({ lineItems: lines, subtotal, serviceFee, total: subtotal + serviceFee }));
});

export default router;
