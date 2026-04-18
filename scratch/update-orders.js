const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const orders = await prisma.order.updateMany({
      where: {
        paymentMethod: {
          in: ['MERCADO_PAGO', 'APLAZO']
        }
      },
      data: {
        paymentMethod: 'STRIPE'
      }
    });
    console.log(`Órdenes actualizadas a STRIPE: ${orders.count}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();