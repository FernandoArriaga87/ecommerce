import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto | AuraSport",
  description: "Canales de atención a clientes y soporte.",
};

export default function ContactoPage() {
  return (
    <LegalPageShell
      title="Contacto"
      subtitle="Estamos para apoyarte"
      lastUpdated="23 de abril de 2026"
    >
      <LegalSection title="1. Atención a clientes">
        <p>
          En AuraSport queremos asegurarnos de que tu experiencia de compra sea excelente de principio a fin. 
          Nuestro equipo de soporte se encuentra operando desde Monterrey, Nuevo León, y estamos listos para resolver 
          cualquier duda que tengas sobre nuestros productos, envíos o procesos.
        </p>
        <p className="mt-2">
          Nuestro horario de atención principal es de <strong>lunes a viernes de 9:00 a 18:00 hrs</strong> (hora del centro de México). 
          Nos esforzamos por responder a todas las consultas en un lapso no mayor a 24 horas hábiles.
        </p>
      </LegalSection>

      <LegalSection title="2. Correo de contacto principal">
        <div className="bg-[#F7F7F7] border border-[#111111]/10 p-6 rounded-lg text-center my-6">
          <p className="text-sm text-[#111111]/60 uppercase tracking-widest font-bold mb-2">Escríbenos a:</p>
          <a href="mailto:contacto@aurasportmx.com" className="text-xl font-black text-[#111111] hover:underline">
            contacto@aurasportmx.com
          </a>
        </div>
        <p>
          Puedes utilizar este correo electrónico para cualquier tema relacionado con:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Dudas antes de realizar una compra (tallas, inventario, materiales).</li>
          <li>Estatus, seguimiento o problemas con el envío de un pedido vigente.</li>
          <li>Reportes de incidencias o posibles defectos de fábrica.</li>
          <li>Comentarios generales y sugerencias para mejorar nuestro catálogo.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Cómo agilizar tu respuesta">
        <p>
          Para que nuestro equipo pueda ayudarte de la manera más rápida y eficiente posible, te recomendamos 
          incluir la siguiente información al enviarnos un correo:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong>Si ya hiciste una compra:</strong> Por favor, incluye tu número de pedido en el asunto del correo. Este número lo puedes encontrar en el correo de confirmación que te llegó al momento de pagar.</li>
          <li><strong>Sé descriptivo:</strong> Cuéntanos exactamente en qué podemos ayudarte. Si se trata de un reporte por daño en el paquete o un defecto, no olvides adjuntar fotografías claras.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Preguntas frecuentes (Recomendación rápida)">
        <p>
          Muchas veces la respuesta a tu duda está a un clic de distancia. Antes de enviarnos un correo, te invitamos a revisar:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong>¿Cuánto tarda en llegar mi paquete?</strong> Revisa nuestra sección de <a href="/envios" className="underline font-bold">Envíos</a>.</li>
          <li><strong>¿Puedo cambiar mi jersey si no me queda?</strong> Contamos con una política estricta de <a href="/devoluciones" className="underline font-bold">Venta Final</a>, te sugerimos revisarla.</li>
        </ul>
      </LegalSection>
    </LegalPageShell>
  );
}
