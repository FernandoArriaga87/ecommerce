import { PrismaClient } from "../src/lib/generated-prisma";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw<
    Array<{ productId: string; size: string; colors: string[]; variantCount: bigint }>
  >`
    SELECT v."productId", v."size", array_agg(v."color") AS colors, count(*) AS "variantCount"
    FROM "Variant" v
    GROUP BY v."productId", v."size"
    HAVING count(*) > 1
  `;

  if (rows.length === 0) {
    console.log("✔ Sin colisiones: cada (productId, size) es único. Seguro eliminar la columna color.");
    return;
  }

  console.log(`⚠  ${rows.length} combinación(es) (productId, size) con múltiples colores:`);
  for (const r of rows) {
    const product = await prisma.product.findUnique({
      where: { id: r.productId },
      select: { name: true },
    });
    console.log(
      `   · ${product?.name || r.productId} — talla ${r.size} — colores: ${r.colors.join(", ")} (${r.variantCount} variantes)`
    );
  }
  console.log(
    "\nAntes del schema push hay que consolidar estas variantes (fusionar stock, repuntar FKs de OrderItem/CartItem)."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
