import { PrismaClient } from "../src/lib/generated-prisma";

const prisma = new PrismaClient();

// One-off cleanup: deletes test orders in PAID / SHIPPED / DELIVERED state.
// Requested by the user during active development — there are no real
// customer orders yet, and wiping paid orders clears the Variant FK graph
// before we consolidate color variants.
//
// Not idempotent in the strict sense, but safe to rerun: it just finds no
// matching rows on the second pass. Does NOT touch PENDING / CANCELLED /
// DISPUTED orders — those may represent in-progress checkouts.
async function main() {
  const STATUSES = ["PAID", "SHIPPED", "DELIVERED"] as const;

  const orders = await prisma.order.findMany({
    where: { status: { in: STATUSES as any } },
    select: { id: true, orderNumber: true, status: true },
  });

  if (orders.length === 0) {
    console.log("✔ No hay órdenes PAID/SHIPPED/DELIVERED que borrar.");
    return;
  }

  console.log(`Borrando ${orders.length} órden(es) (${STATUSES.join(", ")})…`);
  for (const o of orders) {
    console.log(`  · ${o.orderNumber} (${o.status})`);
  }

  // OrderItem has onDelete: Cascade on Order, so they go with it.
  // Review.orderId is a plain string (no FK), so reviews are left untouched
  // even if they reference a now-deleted order — harmless for test data.
  const { count } = await prisma.order.deleteMany({
    where: { status: { in: STATUSES as any } },
  });

  console.log(`\n✔ ${count} órdenes eliminadas (con sus OrderItem por cascade).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
