const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("Users:", users);

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: true }
  });
  console.log("Recent Orders:");
  orders.forEach(o => {
    console.log(`- Order: ${o.orderNumber}, Status: ${o.status}, User Email: ${o.user?.email}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });