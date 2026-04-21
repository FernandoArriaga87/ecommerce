import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser, logAudit } from "@/lib/admin-utils";
import { toCsv, csvResponseHeaders } from "@/lib/csv";

// GET /api/admin/export/orders
// Streams a CSV of every order (most recent first). Admin-only; writes an
// AuditLog entry so downloads are traceable.
export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { quantity: true } },
      address: true,
    },
  });

  const headers = [
    "Pedido",
    "Fecha",
    "Estado",
    "Cliente",
    "Email",
    "Teléfono",
    "Dirección",
    "Ciudad",
    "Estado (Dir.)",
    "CP",
    "Paquetería",
    "Tracking",
    "Subtotal",
    "Envío",
    "Total",
    "Método",
    "Artículos",
    "Entrega Personal",
    "Envío Gratis",
    "Enviado",
    "Entregado",
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    o.createdAt,
    o.status,
    o.user.name,
    o.user.email,
    o.address?.phone ?? "",
    o.address?.address ?? "",
    o.address?.city ?? "",
    o.address?.state ?? "",
    o.address?.zipCode ?? "",
    o.carrier ?? "",
    o.trackingNumber ?? "",
    Number(o.subtotal).toFixed(2),
    Number(o.shipping).toFixed(2),
    Number(o.total).toFixed(2),
    o.paymentMethod,
    o.items.reduce((acc, it) => acc + it.quantity, 0),
    o.isPersonalDelivery ? "sí" : "no",
    o.isFreeShipping ? "sí" : "no",
    o.shippedAt ?? "",
    o.deliveredAt ?? "",
  ]);

  const csv = toCsv(headers, rows);

  await logAudit({
    actorId: admin.id,
    action: "EXPORT_CSV",
    entityType: "ORDER",
    entityIds: orders.map((o) => o.id),
    metadata: { count: orders.length },
  });

  const filename = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, { headers: csvResponseHeaders(filename) });
}
