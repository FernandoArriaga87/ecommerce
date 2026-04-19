import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const categories = await prisma.category.findMany({
            select: { name: true }
        });
        console.log('Categories:', categories.map(c => c.name));

        const products = await prisma.product.findMany({
            include: { variants: true }
        });
        console.log('--- ALL PRODUCTS ---');
        products.forEach(p => {
            console.log(`- ${p.name} (ID: ${p.id})`);
            p.variants.forEach(v => {
                console.log(`  [${v.size}] Stock: ${v.stock} (ID: ${v.id})`);
            });
        });

        const madrid = products.find(p => p.name.includes('Madrid'));
        if (!madrid) {
            console.log('\n!!! Jersey Madrid not found in database !!!');
        } else {
            console.log('\nFound Madrid:', JSON.stringify(madrid, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
