import { PrismaClient } from "../src/lib/generated-prisma";

const prisma = new PrismaClient();

async function main() {
  const res = await prisma.product.updateMany({
    data: { price: 700, comparePrice: null },
  });
  console.log(`Precios actualizados: ${res.count} productos ahora cuestan $700.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
