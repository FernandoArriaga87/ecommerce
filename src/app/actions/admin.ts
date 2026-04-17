"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function createProductAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const price = formData.get("price") as string;
  const teamId = formData.get("teamId") as string;
  const categoryId = formData.get("categoryId") as string;
  const imageFiles = formData.getAll("imageFiles") as File[];
  const isFeatured = formData.get("isFeatured") === "on";
  const isNew = formData.get("isNew") === "on";

  if (!name || !slug || !price || !teamId || !categoryId || imageFiles.length === 0 || imageFiles[0].size === 0) {
    return { error: "Todos los campos principales y al menos una imagen son obligatorios." };
  }

  const imageUrls: string[] = [];

  try {
    const supabase = await createClient();
    
    for (const imageFile of imageFiles) {
      if (imageFile.size === 0) continue;
      
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${slug}-${Math.round(Math.random()*1000)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(uploadError);
        return { error: "Fallo al subir imágenes. Asegúrate de configurar Supabase Storage." };
      }

      const { data } = supabase.storage.from('products').getPublicUrl(fileName);
      imageUrls.push(data.publicUrl);
    }

  } catch (err) {
    console.error("Storage upload err:", err);
    return { error: "Crash al conectarse al Storage." };
  }

  try {
    await prisma.product.create({
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
  } catch (error: any) {
    console.error("Prisma error:", error);
    return { error: `Casi lo logramos. Fallo en Base de datos: ${error.message}` };
  }

  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProductAction(productId: string) {
  try {
    const supabase = await createClient(); // Para verificar sesión o rol
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
  
  const imageFiles = formData.getAll("imageFiles") as File[];
  const existingImageUrl = formData.get("existingImageUrl") as string;

  if (!id || !name || !slug || !price || !teamId || !categoryId) {
    return { error: "Todos los campos obligatorios deben estar llenos." };
  }

  let finalImageUrls: string[] = existingImageUrl ? [existingImageUrl] : []; // Mantenemos la primera imagen fallback por compatibilidad

  try {
    const supabase = await createClient();
    
    // Si se subió al menos un archivo real, reemplazamos el array
    if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      finalImageUrls = []; // Reseteamos para poner las nuevas
      
      for (const imageFile of imageFiles) {
        if (imageFile.size === 0) continue;
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${slug}-${Math.round(Math.random()*1000)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, imageFile, { upsert: false });

        if (uploadError) {
          return { error: "Fallo al subir nuevas imágenes." };
        }
        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
        finalImageUrls.push(data.publicUrl);
      }
    }

    await prisma.product.update({
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
  } catch (error) {
    console.error("Update error:", error);
    return { error: "Crash al actualizar producto." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/products");
}
