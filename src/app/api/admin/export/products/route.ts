import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser, logAudit } from "@/lib/admin-utils";
import { toCsv, csvResponseHeaders } from "@/lib/csv";

// GET /api/admin/export/products
// One row per variant — that's the level of granularity admins actually need
// for inventory audits. The parent product's info is repeated on every row
// so the CSV is self-contained in Excel.
export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      team: { select: { name: true } },
      variants: true,
    },
  });

  const headers = [
    "Producto",
    "Slug",
    "Equipo",
    "Categoría",
    "Precio",
    "Precio Comparación",
    "Activo",
    "Nuevo",
    "Destacado",
    "Talla",
    "SKU",
    "Stock",
    "Creado",
  ];

  const rows: unknown[][] = [];
  const entityIds: string[] = [];

  for (const p of products) {
    entityIds.push(p.id);
    const active = p.isActive ? "sí" : "no";
    const isNew = p.isNew ? "sí" : "no";
    const featured = p.isFeatured ? "sí" : "no";
    const price = Number(p.price).toFixed(2);
    const compare = p.comparePrice != null ? Number(p.comparePrice).toFixed(2) : "";

    if (p.variants.length === 0) {
      rows.push([
        p.name,
        p.slug,
        p.team.name,
        p.category.name,
        price,
        compare,
        active,
        isNew,
        featured,
        "",
        "",
        0,
        p.createdAt,
      ]);
      continue;
    }

    for (const v of p.variants) {
      rows.push([
        p.name,
        p.slug,
        p.team.name,
        p.category.name,
        price,
        compare,
        active,
        isNew,
        featured,
        v.size,
        v.sku,
        v.stock,
        p.createdAt,
      ]);
    }
  }

  const csv = toCsv(headers, rows);

  await logAudit({
    actorId: admin.id,
    action: "EXPORT_CSV",
    entityType: "PRODUCT",
    entityIds,
    metadata: { productCount: products.length, rowCount: rows.length },
  });

  const filename = `productos-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, { headers: csvResponseHeaders(filename) });
}
