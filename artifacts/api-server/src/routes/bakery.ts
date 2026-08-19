import { Router, type IRouter } from "express";
import {
  CalculateCakeQuoteBody,
  CalculateCakeQuoteResponse,
  CreateInventoryBody,
  CreateInventoryResponse,
  GetBakerySummaryResponse,
  ListEquipmentResponse,
  ListInventoryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

let inventory = [
  { id: 1, name: "Cake flour", category: "Dry goods", unit: "kg", quantity: 18, reorderAt: 8, cost: 42, status: "In stock" },
  { id: 2, name: "Vanilla extract", category: "Flavourings", unit: "ml", quantity: 620, reorderAt: 250, cost: 95, status: "In stock" },
  { id: 3, name: "Unsalted butter", category: "Dairy", unit: "kg", quantity: 4.5, reorderAt: 6, cost: 140, status: "Reorder soon" },
  { id: 4, name: "Dutch cocoa", category: "Dry goods", unit: "kg", quantity: 2.2, reorderAt: 2, cost: 115, status: "In stock" },
  { id: 5, name: "Gold leaf sheets", category: "Decor", unit: "pack", quantity: 2, reorderAt: 3, cost: 180, status: "Low stock" },
];

const equipment = [
  { id: 1, name: "Hobart mixer", category: "Mixing", status: "Ready", nextService: "12 Sep 2026" },
  { id: 2, name: "Rational oven", category: "Baking", status: "Ready", nextService: "28 Sep 2026" },
  { id: 3, name: "Cake turntable set", category: "Finishing", status: "In use", nextService: "—" },
  { id: 4, name: "Blast chiller", category: "Cooling", status: "Service due", nextService: "04 Sep 2026" },
];

router.get("/bakery/summary", (_req, res) => {
  const data = GetBakerySummaryResponse.parse({
    revenue: 18420,
    openOrders: 12,
    lowStockCount: inventory.filter((item) => item.quantity <= item.reorderAt).length,
    inventoryValue: 6420,
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

router.get("/bakery/inventory", (_req, res) => {
  res.json(ListInventoryResponse.parse(inventory));
});

router.post("/bakery/inventory", (req, res) => {
  const input = CreateInventoryBody.parse(req.body);
  const item = {
    ...input,
    id: inventory.length + 1,
    status: input.quantity <= input.reorderAt ? "Reorder soon" : "In stock",
  };
  inventory = [...inventory, item];
  res.status(201).json(CreateInventoryResponse.parse(item));
});

router.get("/bakery/equipment", (_req, res) => {
  res.json(ListEquipmentResponse.parse(equipment));
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