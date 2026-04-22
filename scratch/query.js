const { PrismaClient } = require('../src/lib/generated-prisma');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findMany({
    where: {
      team: { slug: { in: ["barcelona", "real-madrid"] } }
    },
    include: { team: true, category: true }
  });
  console.log("Europeos:", p.length, p.map(x => x.slug));
}
main().catch(console.error).finally(() => prisma.$disconnect());
