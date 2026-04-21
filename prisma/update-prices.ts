import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const res = await prisma.product.updateMany({
    data: { price: 600, comparePrice: null },
  });
  console.log(`Precios actualizados: ${res.count} productos ahora cuestan $600.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
