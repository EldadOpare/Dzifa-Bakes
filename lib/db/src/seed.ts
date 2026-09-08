import { db, pool } from "./index";
import { inventory, equipment } from "./schema";
import { inventorySeed, equipmentSeed } from "./seed-data";

async function seed() {
  await db.delete(inventory);
  await db.insert(inventory).values(inventorySeed);

  await db.delete(equipment);
  await db.insert(equipment).values(equipmentSeed);

  console.log(`Seeded ${inventorySeed.length} inventory items and ${equipmentSeed.length} equipment items.`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
