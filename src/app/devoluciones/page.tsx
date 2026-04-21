import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Devoluciones | AuraSport",
  description: "Cómo solicitar un cambio o devolución de tu pedido.",
};

export default function DevolucionesPage() {
  return (
    <LegalPageShell
      title="Devoluciones y Cambios"
      subtitle="Tu compra está protegida"
      lastUpdated="19 de abril de 2026"
    >
      <p className="text-sm bg-[#FFF8E1] border-l-4 border-amber-500 p-4 text-[#111111]/70">
        <strong>Documento base.</strong> Ajusta plazos, costos de envío de devolución y correo de contacto
        antes de publicar.
      </p>

      <LegalSection title="1. Plazo para devolver">
        <p>
          Tienes <strong>5 días hábiles</strong> a partir de recibir tu pedido para solicitar una
          devolución, conforme al artículo 56 de la Ley Federal de Protección al Consumidor (LFPC).
          Para cambios por talla tienes <strong>30 días naturales</strong>.
        </p>
      </LegalSection>

      <LegalSection title="2. Condiciones del producto">
        <p>El producto debe regresar:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Sin uso, sin olores, sin manchas ni lavado.</li>
          <li>Con todas sus etiquetas originales (hangtag de producto).</li>
          <li>En su empaque original si aplica.</li>
          <li>Acompañado del ticket o número de pedido.</li>
        </ul>
        <p>
          Si el producto no cumple estas condiciones, la devolución puede ser rechazada o reembolsada
          parcialmente (hasta 30% de descuento por deterioro).
        </p>
      </LegalSection>

      <LegalSection title="3. Productos no retornables">
        <ul className="list-disc pl-6 space-y-1">
          <li>Playeras con personalización (nombre, número, dorsal, parche especial).</li>
          <li>Productos marcados explícitamente como &quot;venta final&quot;.</li>
          <li>Productos en promoción con descuento superior al 50%, salvo defecto.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cómo iniciar una devolución">
        <ol className="list-decimal pl-6 space-y-1">
          <li>Escribe a <strong>devoluciones@aurasport.mx</strong> con tu número de pedido y el motivo.</li>
          <li>Te enviaremos una guía de retorno prepagada (en caso de error nuestro o producto defectuoso) o instrucciones para el envío (en caso de cambio por decisión del cliente).</li>
          <li>Empaca el producto bien protegido y envíalo al domicilio indicado en la guía.</li>
          <li>Una vez recibido e inspeccionado (2–3 días hábiles), procesaremos tu reembolso o cambio.</li>
        </ol>
      </LegalSection>

      <LegalSection title="5. Costos de envío">
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Error nuestro o producto defectuoso:</strong> nosotros cubrimos el envío de retorno y el reenvío.</li>
          <li><strong>Cambio de talla o decisión del cliente:</strong> el cliente cubre el envío de retorno. El reenvío corre por nuestra cuenta si es dentro de los primeros 30 días.</li>
          <li>El envío original no se reembolsa, salvo error nuestro.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Plazo de reembolso">
        <p>
          Una vez aprobada la devolución, el reembolso se aplicará al mismo medio de pago original en un
          plazo de <strong>5 a 10 días hábiles</strong>. El tiempo exacto depende de tu banco o emisor de
          tarjeta.
        </p>
      </LegalSection>

      <LegalSection title="7. Productos dañados en tránsito">
        <p>
          Si tu paquete llega dañado, tómale foto antes de abrirlo y escríbenos dentro de las
          <strong> 48 horas</strong> siguientes a la entrega. Levantaremos el reporte con la paquetería y
          gestionaremos un reemplazo o reembolso completo.
        </p>
      </LegalSection>

      <LegalSection title="8. Producto para aficionados">
        <p>
          Nuestros jerseys son <strong>réplicas de aficionado</strong> inspiradas en los diseños de
          equipos, ligas y selecciones. No son productos oficiales ni licenciados, y no están afiliados
          ni respaldados por los clubes, ligas, federaciones o sus patrocinadores.
        </p>
        <p>
          Al comprar declaras que entiendes esta condición. Por eso no aceptamos devoluciones
          fundamentadas en &quot;no es original&quot;, ya que nunca fue representado como tal.
        </p>
      </LegalSection>

      <LegalSection title="9. PROFECO">
        <p>
          Si no queda resuelta tu inconformidad, puedes acudir a la Procuraduría Federal del Consumidor
          (PROFECO): <a href="https://www.gob.mx/profeco" className="underline font-bold">gob.mx/profeco</a>
          {" · "}Tel. <strong>800 468 8722</strong>.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
