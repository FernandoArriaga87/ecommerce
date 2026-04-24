import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().trim().min(3, "El nombre es demasiado corto").max(120, "Nombre demasiado largo"),
  email: z.string().trim().email("Email inválido").max(254, "Email demasiado largo"),
  phone: z.string().trim().min(10, "El teléfono debe tener al menos 10 dígitos").max(20, "Teléfono inválido"),
  address: z.string().trim().min(5, "La dirección es obligatoria").max(200, "Dirección demasiado larga"),
  city: z.string().trim().min(2, "La ciudad es obligatoria").max(80, "Ciudad demasiado larga"),
  state: z.string().trim().min(2, "El estado es obligatorio").max(80, "Estado demasiado largo"),
  zipCode: z.string().regex(/^\d{5}$/, "Código postal inválido"),
  addressId: z.string().uuid("ID de dirección inválido").optional().nullable(),
  // Acepta UUID de una cotización persistida o el sentinel "free_shipping"
  // que el cliente envía cuando el subtotal califica para envío gratuito.
  quoteId: z.union([
    z.string().uuid(),
    z.literal("free_shipping"),
  ], { message: "Cotización inválida — vuelve a cotizar el envío" }),
  shippingRateId: z.string().min(1, "Selecciona una opción de envío").max(200),
  items: z.array(
    z.object({
      productId: z.string().uuid("ID de producto inválido"),
      size: z.string().min(1, "La talla es obligatoria").max(10),
      quantity: z.number().int().positive("La cantidad debe ser mayor a 0").max(99, "Cantidad máxima 99 por talla"),
    })
  ).min(1, "El carrito está vacío").max(50, "Carrito demasiado grande"),
});
