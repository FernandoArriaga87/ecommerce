const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting data migration for OrderStatus...");
  
  try {
    // Since the enum was changed in Prisma, we can't use the enum names in queries easily if the DB rejects them.
    // We'll use raw SQL to fix the data.
    
    // 1. Check current statuses and column info
    const columnInfo = await prisma.$queryRaw`
      SELECT column_name, column_default, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Order' AND column_name = 'status'
    `;
    console.log("Column Info:", columnInfo);

    const statuses = await prisma.$queryRaw`SELECT DISTINCT status FROM "Order"`;
    console.log("Current statuses in DB:", statuses);

    // 2. Update 'CONFIRMED' and 'PROCESSING' to 'PAID'
    // We cast to text to avoid enum validation errors during the WHERE clause
    const updateConfirmed = await prisma.$executeRaw`
      UPDATE "Order" SET status = 'PAID'::"OrderStatus" WHERE status::text = 'CONFIRMED'
    `;
    console.log(`Updated orders from CONFIRMED to PAID`);

    const updateProcessing = await prisma.$executeRaw`
      UPDATE "Order" SET status = 'PAID'::"OrderStatus" WHERE status::text = 'PROCESSING'
    `;
    console.log(`Updated orders from PROCESSING to PAID`);


  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
