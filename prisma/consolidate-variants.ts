import { PrismaClient } from "../src/lib/generated-prisma";

const prisma = new PrismaClient();

// One-off data migration: collapse all variants that share (productId, size) but
// differ only by color into a single canonical variant. The product catalogue
// now treats each jersey design (Local, Visita, Retro) as its own Product, so
// Variant.color is about to be dropped from the schema — this script prepares
// the data so the unique constraint (productId, size) will hold after push.
//
// Strategy per (productId, size) group:
//   · Pick the variant with the highest stock as the canonical one
//   · Re-point CartItem / OrderItem FKs to the canonical variant
//     (merging quantities on CartItem where the unique [cartId, variantId]
//     would otherwise collide)
//   · Keep MAX(stock) across the group — color rows were redundant copies of
//     the same inventory (stock was synced by catalog seeds), not separate
//     buckets. SUM would double-count.
//   · Delete the other variants
//
// Idempotent: a second run finds no groups with count > 1 and no-ops.
async function main() {
  const groups = await prisma.$queryRaw<
    Array<{ productId: string; size: string; variantIds: string[] }>
  >`
    SELECT v."productId", v."size", array_agg(v."id") AS "variantIds"
    FROM "Variant" v
    GROUP BY v."productId", v."size"
    HAVING count(*) > 1
  `;

  if (groups.length === 0) {
    console.log("✔ Nada que consolidar.");
    return;
  }

  console.log(`Consolidando ${groups.length} grupo(s) (productId, size)…`);

  for (const group of groups) {
    await prisma.$transaction(async (tx) => {
      const variants = await tx.variant.findMany({
        where: { id: { in: group.variantIds } },
        orderBy: [{ stock: "desc" }, { id: "asc" }],
      });
      const [canonical, ...others] = variants;
      // variants ordered by stock desc, so canonical already holds the MAX.
      const maxStock = canonical.stock;

      for (const other of others) {
        // CartItem: repoint, merging on (cartId, canonical.id) when needed.
        const cartItems = await tx.cartItem.findMany({
          where: { variantId: other.id },
        });
        for (const ci of cartItems) {
          const existing = await tx.cartItem.findUnique({
            where: { cartId_variantId: { cartId: ci.cartId, variantId: canonical.id } },
          });
          if (existing) {
            await tx.cartItem.update({
              where: { id: existing.id },
              data: { quantity: existing.quantity + ci.quantity },
            });
            await tx.cartItem.delete({ where: { id: ci.id } });
          } else {
            await tx.cartItem.update({
              where: { id: ci.id },
              data: { variantId: canonical.id },
            });
          }
        }

        // OrderItem has no unique constraint — safe to repoint directly.
        await tx.orderItem.updateMany({
          where: { variantId: other.id },
          data: { variantId: canonical.id },
        });

        await tx.variant.delete({ where: { id: other.id } });
      }

      // No update needed — canonical already has MAX(stock).

      const product = await tx.product.findUnique({
        where: { id: group.productId },
        select: { name: true },
      });
      console.log(
        `  ✔ ${product?.name} — talla ${group.size}: fusionadas ${others.length + 1} → 1 (stock=${maxStock})`
      );
    }, { isolationLevel: "Serializable" });
  }

  console.log("\n✔ Consolidación completa. Ahora sí corre `npx prisma db push`.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
