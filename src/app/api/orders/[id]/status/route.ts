import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { resend, SEND_FROM } from "@/lib/resend";
import OrderShippedEmail from "@/components/emails/OrderShippedEmail";
import OrderDeliveredEmail from "@/components/emails/OrderDeliveredEmail";
import { formatPrice } from "@/lib/data";

// PATCH /api/orders/[id]/status
// Body: { status: "SHIPPED" | "DELIVERED" }
// Protected: requires ADMIN role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    // 1. Auth check
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Role check
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado: se requiere rol de administrador" }, { status: 403 });
    }

    // 3. Validate status transition
    const validStatuses = ["SHIPPED", "DELIVERED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Estado inválido. Valores permitidos: ${validStatuses.join(", ")}` 
      }, { status: 400 });
    }

    // 4. Get order with user info
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // 5. Validate status transition logic
    const allowedTransitions: Record<string, string[]> = {
      PAID: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
    };

    const allowed = allowedTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json({ 
        error: `No se puede cambiar de "${order.status}" a "${status}". Transiciones permitidas: ${allowed?.join(", ") || "ninguna"}` 
      }, { status: 400 });
    }

    // 6. Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    // 7. Send corresponding email notification
    if (resend && order.user?.email) {
      const customerName = order.user.name.split(" ")[0] || "Cliente";

      try {
        if (status === "SHIPPED") {
          const shipAddr = await prisma.address.findUnique({
            where: { id: order.addressId },
          });
          const shippedItems = order.items.map((it) => ({
            name: it.variant.product.name,
            size: it.variant.size,
            quantity: it.quantity,
            price: formatPrice(Number(it.total)),
          }));
          const { data, error: sendError } = await resend.emails.send({
            from: SEND_FROM,
            to: order.user.email,
            subject: `📦 ¡Tu pedido ${order.orderNumber} va en camino!`,
            react: OrderShippedEmail({
              orderNumber: order.orderNumber,
              customerName,
              carrier: order.carrier || undefined,
              trackingNumber: order.trackingNumber || undefined,
              trackingUrl: order.trackingUrl || undefined,
              items: shippedItems,
              shippingAddress: shipAddr ? {
                name: shipAddr.name,
                address: shipAddr.address,
                city: shipAddr.city,
                state: shipAddr.state,
                zipCode: shipAddr.zipCode,
              } : undefined,
            }),
          });
          if (sendError) console.error("Error API Resend (envío):", sendError);
          else console.log(`📧 Email de envío enviado con éxito para orden: ${order.orderNumber}`, data);
        }

        if (status === "DELIVERED") {
          const { data, error: sendError } = await resend.emails.send({
            from: SEND_FROM,
            to: order.user.email,
            subject: `🎉 ¡Tu pedido ${order.orderNumber} ha sido entregado!`,
            react: OrderDeliveredEmail({
              orderNumber: order.orderNumber,
              customerName,
            }),
          });
          if (sendError) console.error("Error API Resend (entrega):", sendError);
          else console.log(`📧 Email de entrega enviado con éxito para orden: ${order.orderNumber}`, data);
        }
      } catch (emailError) {
        console.error("Excepción enviando email de estado:", emailError);
        // No fallamos la request si el email falla
      }
    }

    return NextResponse.json({ 
      success: true, 
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
      }
    });
  } catch (error: any) {
    console.error("Error actualizando estado de orden:", error);
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
