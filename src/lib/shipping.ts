// Subtotal (en MXN) a partir del cual el envío es gratis.
// La tienda absorbe el costo real cobrado por la paquetería.
export const FREE_SHIPPING_THRESHOLD = 1499;

export function qualifiesForFreeShipping(subtotal: number): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLD;
}
