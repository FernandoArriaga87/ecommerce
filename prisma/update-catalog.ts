import { PrismaClient } from "../src/lib/generated-prisma";

const prisma = new PrismaClient();

const SIZES = ["S", "M", "L", "XL"] as const;
const DEFAULT_PRICE = 700;

// One-off catalog reshuffle.
// - 4 products become the "in-stock" lineup (stock 20/size, isNew=true).
// - 4 teams are rebranded (Toluca→Barcelona, Pumas→Real Madrid, Cruz Azul→Brasil,
//   Chivas→Argentina) with their single product renamed and all variants set
//   to stock 0 so the PDP shows AGOTADO.
// - México is added as a new selección + product.
// Idempotent: rerunnable; uses slug upserts.
async function main() {
  const ligaMx = await prisma.category.findUnique({ where: { slug: "liga-mx" } });
  if (!ligaMx) throw new Error("Categoría liga-mx no existe. Corre el seed primero.");

  // ── IN-STOCK LINEUP ─────────────────────────────────────────────
  // 1. Tigres — rename to Aniversario 65 Retro
  await renameExistingProduct({
    teamSlug: "tigres",
    newName: "Jersey de Aniversario 65 Tigres UANL - Retro",
    newSlug: "jersey-aniversario-65-tigres-retro",
    isNew: true,
    stock: 20,
  });

  // 2. Rayados — rename the existing 24/25 to Aniversario 80 Retro
  await renameExistingProduct({
    teamSlug: "rayados",
    newName: "Jersey de Aniversario 80 Rayados CF - Retro",
    newSlug: "jersey-aniversario-80-rayados-retro",
    isNew: true,
    stock: 20,
    matchSlug: "jersey-rayados-local-2425",
  });

  // 3. Rayados — add a second product: Local 25/26
  const rayadosTeam = await prisma.team.findUnique({ where: { slug: "rayados" } });
  await upsertProductWithVariants({
    slug: "jersey-rayados-local-2526",
    name: "Jersey Rayados Local 25/26",
    teamId: rayadosTeam!.id,
    categoryId: ligaMx.id,
    images: ["/brazilshirt.webp"],
    isNew: true,
    stock: 20,
  });

  // 4. México — new team + new product
  const mexico = await prisma.team.upsert({
    where: { slug: "mexico" },
    update: { name: "Selección Mexicana" },
    create: { name: "Selección Mexicana", slug: "mexico" },
  });
  await upsertProductWithVariants({
    slug: "jersey-mexico-local-2026",
    name: "Jersey México Local 2026",
    teamId: mexico.id,
    categoryId: ligaMx.id,
    images: ["/brazilshirt.webp"],
    isNew: true,
    stock: 20,
  });

  // ── AGOTADOS (team rename + stock 0) ────────────────────────────
  await renameTeamAndProduct({
    fromTeamSlug: "toluca",
    toTeamName: "FC Barcelona",
    toTeamSlug: "barcelona",
    newProductName: "Jersey Barcelona Local 25/26",
    newProductSlug: "jersey-barcelona-local-2526",
  });
  await renameTeamAndProduct({
    fromTeamSlug: "pumas",
    toTeamName: "Real Madrid CF",
    toTeamSlug: "real-madrid",
    newProductName: "Jersey Real Madrid Local 25/26",
    newProductSlug: "jersey-real-madrid-local-2526",
  });
  await renameTeamAndProduct({
    fromTeamSlug: "cruz-azul",
    toTeamName: "Selección de Brasil",
    toTeamSlug: "brasil",
    newProductName: "Jersey Brasil Local 2026",
    newProductSlug: "jersey-brasil-local-2026",
  });
  await renameTeamAndProduct({
    fromTeamSlug: "chivas",
    toTeamName: "Selección de Argentina",
    toTeamSlug: "argentina",
    newProductName: "Jersey Argentina Local 2026",
    newProductSlug: "jersey-argentina-local-2026",
  });

  console.log("✔ Catalog update completado.");
}

async function renameExistingProduct(opts: {
  teamSlug: string;
  newName: string;
  newSlug: string;
  isNew: boolean;
  stock: number;
  matchSlug?: string;
}) {
  const team = await prisma.team.findUnique({ where: { slug: opts.teamSlug } });
  if (!team) {
    console.warn(`  · Team ${opts.teamSlug} no existe, skip.`);
    return;
  }
  const product = await prisma.product.findFirst({
    where: opts.matchSlug
      ? { teamId: team.id, slug: opts.matchSlug }
      : { teamId: team.id },
    orderBy: { createdAt: "asc" },
  });
  if (!product) {
    console.warn(`  · Product para team ${opts.teamSlug} no encontrado, skip.`);
    return;
  }
  await prisma.product.update({
    where: { id: product.id },
    data: {
      name: opts.newName,
      slug: opts.newSlug,
      isNew: opts.isNew,
      isActive: true,
      isDeleted: false,
      price: DEFAULT_PRICE,
    },
  });
  await prisma.variant.updateMany({
    where: { productId: product.id },
    data: { stock: opts.stock },
  });
  console.log(`  ✔ ${opts.newName} — stock=${opts.stock}, isNew=${opts.isNew}`);
}

async function upsertProductWithVariants(opts: {
  slug: string;
  name: string;
  teamId: string;
  categoryId: string;
  images: string[];
  isNew: boolean;
  stock: number;
}) {
  const product = await prisma.product.upsert({
    where: { slug: opts.slug },
    update: {
      name: opts.name,
      isNew: opts.isNew,
      isActive: true,
      isDeleted: false,
      images: opts.images,
      price: DEFAULT_PRICE,
      teamId: opts.teamId,
      categoryId: opts.categoryId,
    },
    create: {
      slug: opts.slug,
      name: opts.name,
      price: DEFAULT_PRICE,
      images: opts.images,
      isNew: opts.isNew,
      isFeatured: false,
      isActive: true,
      teamId: opts.teamId,
      categoryId: opts.categoryId,
    },
  });

  for (const size of SIZES) {
    const sku = `${opts.slug.toUpperCase()}-${size}`;
    await prisma.variant.upsert({
      where: { productId_size: { productId: product.id, size } },
      update: { stock: opts.stock },
      create: {
        productId: product.id,
        size,
        stock: opts.stock,
        sku,
      },
    });
  }
  console.log(`  ✔ ${opts.name} — stock=${opts.stock}/size`);
}

async function renameTeamAndProduct(opts: {
  fromTeamSlug: string;
  toTeamName: string;
  toTeamSlug: string;
  newProductName: string;
  newProductSlug: string;
}) {
  const team = await prisma.team.findUnique({ where: { slug: opts.fromTeamSlug } });
  if (!team) {
    console.warn(`  · Team ${opts.fromTeamSlug} ya no existe, skip.`);
    return;
  }

  await prisma.team.update({
    where: { id: team.id },
    data: { name: opts.toTeamName, slug: opts.toTeamSlug },
  });

  const product = await prisma.product.findFirst({
    where: { teamId: team.id },
    orderBy: { createdAt: "asc" },
  });
  if (product) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        name: opts.newProductName,
        slug: opts.newProductSlug,
        isNew: false,
        isActive: true,
        isDeleted: false,
      },
    });
    await prisma.variant.updateMany({
      where: { productId: product.id },
      data: { stock: 0 },
    });
  }
  console.log(`  ✔ ${opts.fromTeamSlug} → ${opts.toTeamSlug}: ${opts.newProductName} (stock 0)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
