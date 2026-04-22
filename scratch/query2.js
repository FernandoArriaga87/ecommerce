const { PrismaClient } = require('../src/lib/generated-prisma');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findMany({
    include: { team: true, category: true }
  });
  console.log(p.map(x => ({ name: x.name, team: x.team.slug, category: x.category?.slug })));
}
main().catch(console.error).finally(() => prisma.$disconnect());