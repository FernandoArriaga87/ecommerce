import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Ensure Category 'Internacional' exists
        const category = await prisma.category.upsert({
            where: { name: 'Internacional' },
            update: {},
            create: { name: 'Internacional' },
        });

        // 2. Ensure Team 'Real Madrid' exists
        const team = await prisma.team.upsert({
            where: { name: 'Real Madrid' },
            update: {},
            create: { 
                name: 'Real Madrid',
                slug: 'real-madrid',
            },
        });

        // 3. Create 'Jersey Madrid Local 24/25'
        const product = await prisma.product.upsert({
            where: { slug: 'jersey-madrid-local-2425' },
            update: { isActive: true },
            create: {
                name: 'Jersey Madrid Local 24/25',
                slug: 'jersey-madrid-local-2425',
                price: 1899,
                categoryId: category.id,
                teamId: team.id,
                isActive: true,
                images: ['https://images.unsplash.com/photo-1518605368461-1e1292237fac?q=80&w=1920&auto=format&fit=crop'],
            },
        });

        // 4. Create variants for Madrid
        const sizes = ['S', 'M', 'L', 'XL'];
        for (const size of sizes) {
            await prisma.variant.upsert({
                where: {
                    productId_size: {
                        productId: product.id,
                        size: size,
                    }
                },
                update: { stock: 100 },
                create: {
                    productId: product.id,
                    size: size,
                    stock: 100,
                    sku: `MADRID-2425-${size}`
                }
            });
        }

        // 5. Final check: set ALL stock to 100 again just in case
        await prisma.variant.updateMany({
            data: { stock: 100 }
        });

        console.log('✅ Real Madrid product created and all stock set to 100!');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
