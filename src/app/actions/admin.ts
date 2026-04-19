"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { resend, SEND_FROM } from "@/lib/resend";
import OrderShippedEmail from "@/components/emails/OrderShippedEmail";

export async function createProductAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const price = formData.get("price") as string;
  const teamId = formData.get("teamId") as string;
  const categoryId = formData.get("categoryId") as string;
  const imageFiles = formData.getAll("imageFiles") as File[];
  const isFeatured = formData.get("isFeatured") === "on";
  const isNew = formData.get("isNew") === "on";
  const variantsJson = formData.get("variantsJson") as string;

  if (!name || !slug || !price || !teamId || !categoryId || !variantsJson) {
    return { error: "Todos los campos principales son obligatorios." };
  }

  const variants = JSON.parse(variantsJson);
  if (variants.length === 0) {
    return { error: "Debes agregar al menos una variante (talla/stock)." };
  }

  const imageUrls: string[] = [];

  try {
    const supabase = await createClient();
    
    for (const imageFile of imageFiles) {
      if (imageFile.size === 0) continue;
      
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${slug}-${Math.round(Math.random()*1000)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(uploadError);
        return { error: "Fallo al subir imágenes." };
      }

      const { data } = supabase.storage.from('products').getPublicUrl(fileName);
      imageUrls.push(data.publicUrl);
    }

  } catch (err) {
    console.error("Storage upload err:", err);
    return { error: "Error de conexión con el almacenamiento." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          slug,
          price: Number(price),
          teamId,
          categoryId,
          images: imageUrls,
          isFeatured,
          isNew,
        }
      });

      // Crear las variantes
      for (const v of variants) {
        await tx.variant.create({
          data: {
            productId: product.id,
            color: v.color,
            size: v.size,
            stock: v.stock,
            sku: `${slug.toUpperCase()}-${v.size.toUpperCase()}-${v.color.toUpperCase().slice(0, 3)}-${Math.round(Math.random()*1000)}`
          }
        });
      }
    });
  } catch (error: any) {
    console.error("Prisma error:", error);
    return { error: `Error en Base de datos: ${error.message}` };
  }

  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProductAction(productId: string) {
  try {
    await prisma.variant.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("Error al eliminar:", err);
    throw new Error("No se pudo eliminar el producto");
  }
}

export async function updateProductAction(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const price = formData.get("price") as string;
  const teamId = formData.get("teamId") as string;
  const categoryId = formData.get("categoryId") as string;
  const isFeatured = formData.get("isFeatured") === "on";
  const isNew = formData.get("isNew") === "on";
  const variantsJson = formData.get("variantsJson") as string;
  
  const imageFiles = formData.getAll("imageFiles") as File[];
  const existingImageUrl = formData.get("existingImageUrl") as string;

  if (!id || !name || !slug || !price || !teamId || !categoryId || !variantsJson) {
    return { error: "Todos los campos obligatorios deben estar llenos." };
  }

  const variants = JSON.parse(variantsJson);

  let finalImageUrls: string[] = existingImageUrl ? [existingImageUrl] : [];

  try {
    const supabase = await createClient();
    
    if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      finalImageUrls = [];
      for (const imageFile of imageFiles) {
        if (imageFile.size === 0) continue;
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${slug}-${Math.round(Math.random()*1000)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, imageFile);
        if (uploadError) return { error: "Fallo al subir nuevas imágenes." };
        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
        finalImageUrls.push(data.publicUrl);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name,
          slug,
          price: Number(price),
          teamId,
          categoryId,
          images: finalImageUrls,
          isFeatured,
          isNew,
        }
      });

      // Para actualizar variantes, una estrategia simple es borrar y recrear 
      // (solo si no hay órdenes asociadas aún, de lo contrario habría que hacer upsert/delete selectivo)
      // Por ahora para este MVP, haremos un borrado de las que no tengan stock 0 y recreación
      await tx.variant.deleteMany({ where: { productId: id } });
      
      for (const v of variants) {
        await tx.variant.create({
          data: {
            productId: id,
            color: v.color,
            size: v.size,
            stock: v.stock,
            sku: `${slug.toUpperCase()}-${v.size.toUpperCase()}-${v.color.toUpperCase().slice(0, 3)}-${Math.round(Math.random()*1000)}`
          }
        });
      }
    });
  } catch (error) {
    console.error("Update error:", error);
    return { error: "Error al actualizar producto y variantes." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function updateOrderStatusAction(orderId: string, newStatus: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED") {
  try {
    const supabase = await createClient();
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { user: true }
    });

    // Si se marca como enviado y tenemos resend configurado
    if (newStatus === "SHIPPED" && resend && order.user?.email) {
      try {
        const { data, error: sendError } = await resend.emails.send({
          from: SEND_FROM,
          to: order.user.email,
          subject: `📦 Tu pedido ${order.orderNumber} va en camino!`,
          react: OrderShippedEmail({ 
            orderNumber: order.orderNumber, 
            customerName: order.user.name.split(" ")[0] || "Cliente"
          }),
        });
        if (sendError) console.error("Error API Resend (envío en admin action):", sendError);
        else console.log(`Correo de envío despachado con éxito para la orden: ${order.orderNumber}`, data);
      } catch (emailError) {
        console.error("Excepción enviando correo de pedido enviado:", emailError);
      }
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Error actualizando estado del pedido:", error);
    return { error: "No se pudo actualizar el estado del pedido." };
  }
}
