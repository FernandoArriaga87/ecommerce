import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { resend, SEND_FROM } from "@/lib/resend";
import OrderShippedEmail from "@/components/emails/OrderShippedEmail";
import OrderDeliveredEmail from "@/components/emails/OrderDeliveredEmail";

// PATCH /api/orders/[id]/status
// Body: { status: "SHIPPED" | "DELIVERED" }
// Protected: requires ADMIN or MODERATOR role
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

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "MODERATOR")) {
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
      include: { user: true },
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
          await resend.emails.send({
            from: SEND_FROM,
            to: order.user.email,
            subject: `📦 ¡Tu pedido ${order.orderNumber} va en camino!`,
            react: OrderShippedEmail({
              orderNumber: order.orderNumber,
              customerName,
            }),
          });
          console.log(`📧 Email de envío enviado para orden: ${order.orderNumber}`);
        }

        if (status === "DELIVERED") {
          await resend.emails.send({
            from: SEND_FROM,
            to: order.user.email,
            subject: `🎉 ¡Tu pedido ${order.orderNumber} ha sido entregado!`,
            react: OrderDeliveredEmail({
              orderNumber: order.orderNumber,
              customerName,
            }),
          });
          console.log(`📧 Email de entrega enviado para orden: ${order.orderNumber}`);
        }
      } catch (emailError) {
        console.error("Error enviando email de estado:", emailError);
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
