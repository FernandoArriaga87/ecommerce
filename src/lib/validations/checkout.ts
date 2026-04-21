import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().min(3, "El nombre es demasiado corto"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  address: z.string().min(5, "La dirección es obligatoria"),
  city: z.string().min(2, "La ciudad es obligatoria"),
  state: z.string().min(2, "El estado es obligatorio"),
  zipCode: z.string().min(4, "Código postal inválido"),
  shippingRateId: z.string().min(1, "Selecciona una opción de envío"),
  items: z.array(
    z.object({
      productId: z.string().uuid("ID de producto inválido"),
      size: z.string().min(1, "La talla es obligatoria"),
      quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
    })
  ).min(1, "El carrito está vacío"),
});
