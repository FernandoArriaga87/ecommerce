import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando Seed...")

  // Limpiar primero
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.variant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.team.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  // 1. User
  const admin = await prisma.user.create({
    data: {
      email: "admin@deportivostore.com",
      password: "ENCRYPTED_MOCK", // no real auth just for db reference
      name: "Super Admin",
      role: "ADMIN"
    }
  })

  // 2. Categories
  const catLigaMx = await prisma.category.create({ data: { name: "Liga MX", slug: "liga-mx" } });
  const catEurope = await prisma.category.create({ data: { name: "Europeos", slug: "europeos" } });
  const catNational = await prisma.category.create({ data: { name: "Selecciones", slug: "selecciones" } });

  // 3. Teams
  const realMadrid = await prisma.team.create({ data: { name: "Madrid", slug: "madrid" } });
  const barca = await prisma.team.create({ data: { name: "Barcelona", slug: "barcelona" } });
  const manBlue = await prisma.team.create({ data: { name: "Manchester Blue", slug: "manchester-blue" } });
  const juventus = await prisma.team.create({ data: { name: "Juventus", slug: "juventus" } });
  const arsenal = await prisma.team.create({ data: { name: "Arsenal", slug: "arsenal" } });
  const nacional = await prisma.team.create({ data: { name: "Selección Nacional", slug: "nacional" } });

  // 4. Products & Variants
  const p1 = await prisma.product.create({
    data: {
      name: "Jersey Madrid Local 24/25",
      slug: "jersey-madrid-local-24-25",
      price: 1899,
      images: ["https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=800&auto=format&fit=crop"],
      isFeatured: true, // "Más vendido"
      categoryId: catEurope.id,
      teamId: realMadrid.id,
      variants: {
        create: [
          { sku: "RM-LOC-2425-S", size: "S", color: "Blanco", stock: 5 },
          { sku: "RM-LOC-2425-M", size: "M", color: "Blanco", stock: 12 },
          { sku: "RM-LOC-2425-L", size: "L", color: "Blanco", stock: 0 },
          { sku: "RM-LOC-2425-XL", size: "XL", color: "Blanco", stock: 3 },
        ]
      }
    }
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Jersey Manchester Blue Visitante",
      slug: "jersey-manchester-blue-visitante",
      price: 1799,
      images: ["https://images.unsplash.com/photo-1544452179-883a992bc0c2?q=80&w=800&auto=format&fit=crop"],
      isNew: true, // "Nuevo"
      categoryId: catEurope.id,
      teamId: manBlue.id,
      variants: {
        create: [
          { sku: "MB-VIS-2425-S", size: "S", color: "Azul-Negro", stock: 0 },
          { sku: "MB-VIS-2425-M", size: "M", color: "Azul-Negro", stock: 8 },
          { sku: "MB-VIS-2425-L", size: "L", color: "Azul-Negro", stock: 4 },
        ]
      }
    }
  });

  const p3 = await prisma.product.create({
    data: {
      name: "Playera Selección Nacional Local",
      slug: "playera-seleccion-nacional-local",
      price: 1999,
      images: ["https://images.unsplash.com/photo-1552554769-cf2be34be108?q=80&w=800&auto=format&fit=crop"],
      categoryId: catNational.id,
      teamId: nacional.id,
      variants: {
        create: [
          { sku: "NAC-LOC-2425-S", size: "S", color: "Verde", stock: 10 },
          { sku: "NAC-LOC-2425-M", size: "M", color: "Verde", stock: 0 },
          { sku: "NAC-LOC-2425-L", size: "L", color: "Verde", stock: 14 },
        ]
      }
    }
  });

  console.log("Mock data inserted successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
