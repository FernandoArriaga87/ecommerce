import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Limpiar base de datos de productos, equipos, categorías y dependencias
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.variant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.team.deleteMany()
  await prisma.category.deleteMany()

  console.log('Datos anteriores eliminados.')

  // Crear Categoría
  const ligaMx = await prisma.category.create({
    data: {
      name: 'Liga MX',
      slug: 'liga-mx',
    },
  })

  console.log('Categoría creada: Liga MX')

  // Crear Equipos
  const teamsData = [
    { name: 'Tigres UANL', slug: 'tigres' },
    { name: 'Rayados de Monterrey', slug: 'rayados' },
    { name: 'Club América', slug: 'america' },
    { name: 'Chivas de Guadalajara', slug: 'chivas' },
    { name: 'Cruz Azul', slug: 'cruz-azul' },
    { name: 'Pumas UNAM', slug: 'pumas' },
    { name: 'Deportivo Toluca', slug: 'toluca' },
    { name: 'Pachuca', slug: 'pachuca' },
  ]

  const teams: Record<string, any> = {}
  for (const t of teamsData) {
    teams[t.slug] = await prisma.team.create({ data: t })
  }

  console.log(`Equipos creados: ${teamsData.length}`)

  // Crear Productos
  const productsData = [
    {
      name: 'Jersey Tigres UANL Local 24/25',
      slug: 'jersey-tigres-local-2425',
      price: 1899,
      images: ['https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=800&auto=format&fit=crop'],
      isNew: true,
      isFeatured: true,
      categoryId: ligaMx.id,
      teamId: teams['tigres'].id,
      colors: ['Amarillo', 'Azul'],
    },
    {
      name: 'Jersey Rayados Local 24/25',
      slug: 'jersey-rayados-local-2425',
      price: 1899,
      images: ['/brazilshirt.webp'],
      isNew: true,
      isFeatured: false,
      categoryId: ligaMx.id,
      teamId: teams['rayados'].id,
      colors: ['Azul', 'Blanco'],
    },
    {
      name: 'Playera Club América Local 24/25',
      slug: 'playera-america-local-2425',
      price: 1999,
      images: ['/america shirt.webp'],
      isNew: false,
      isFeatured: true,
      categoryId: ligaMx.id,
      teamId: teams['america'].id,
      colors: ['Amarillo'],
    },
    {
      name: 'Jersey Chivas Local 24/25',
      slug: 'jersey-chivas-local-2425',
      price: 1799,
      images: ['/Sin título (2).png'],
      isNew: true,
      isFeatured: true,
      categoryId: ligaMx.id,
      teamId: teams['chivas'].id,
      colors: ['Rojo', 'Blanco'],
    },
    {
      name: 'Jersey Cruz Azul Local 23/24',
      slug: 'jersey-cruz-azul-local-2324',
      price: 1699,
      images: ['/camisetas-liga-mx-2023-24-cruz-azul-1.jpg'],
      isNew: false,
      isFeatured: false,
      categoryId: ligaMx.id,
      teamId: teams['cruz-azul'].id,
      colors: ['Azul'],
    },
    {
      name: 'Playera Pumas UNAM Visita 24/25',
      slug: 'playera-pumas-visita-2425',
      price: 1899,
      images: ['/brazilshirt.webp'],
      isNew: true,
      isFeatured: false,
      categoryId: ligaMx.id,
      teamId: teams['pumas'].id,
      colors: ['Oro'],
    },
    {
      name: 'Jersey Toluca Local 24/25',
      slug: 'jersey-toluca-local-2425',
      price: 1599,
      images: ['https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=800&auto=format&fit=crop'],
      isNew: true,
      isFeatured: false,
      categoryId: ligaMx.id,
      teamId: teams['toluca'].id,
      colors: ['Rojo'],
    },
    {
      name: 'Jersey Pachuca Tercera Equipación',
      slug: 'jersey-pachuca-tercera',
      price: 1499,
      images: ['/Sin título (3).png'],
      isNew: false,
      isFeatured: false,
      categoryId: ligaMx.id,
      teamId: teams['pachuca'].id,
      colors: ['Negro'],
    },
  ]

  const sizes = ['S', 'M', 'L', 'XL']

  for (const pData of productsData) {
    const { colors, ...productInput } = pData
    const product = await prisma.product.create({
      data: productInput
    })

    let variantCount = 0;
    for (const color of colors) {
      for (const size of sizes) {
        // Asignar un stock aleatorio entre 0 y 20 para ver alertas en el dashboard
        const stock = Math.floor(Math.random() * 21); 
        
        await prisma.variant.create({
          data: {
            productId: product.id,
            color,
            size,
            stock,
            sku: `${product.slug.toUpperCase()}-${size}-${color.substring(0,3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`
          }
        })
        variantCount++;
      }
    }
    console.log(`Producto creado: ${product.name} con ${variantCount} variantes.`)
  }

  console.log('¡Seeding completado con éxito!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
