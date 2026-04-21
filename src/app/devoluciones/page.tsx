import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Devoluciones | AuraSport",
  description:
    "No aceptamos devoluciones por tratarse de productos con descuento superior al 50%, salvo error nuestro o producto defectuoso.",
};

export default function DevolucionesPage() {
  return (
    <LegalPageShell
      title="Devoluciones"
      subtitle="Venta final — compra informada"
      lastUpdated="21 de abril de 2026"
    >
      <p className="text-sm bg-[#FFF3F3] border-l-4 border-red-500 p-4 text-[#111111]/80">
        <strong>No aceptamos devoluciones ni cambios.</strong> Todos nuestros jerseys se venden
        con un descuento <strong>superior al 50%</strong> sobre su precio de referencia, por lo
        que califican como <em>venta final</em> conforme a nuestros Términos y Condiciones y al
        artículo 56 de la LFPC (exclusiones por promoción). Únicamente procesamos reposiciones
        en los supuestos del punto&nbsp;3.
      </p>

      <LegalSection title="1. Por qué no hay devoluciones">
        <p>
          Operamos con márgenes mínimos para poder mantener los jerseys a un precio accesible.
          Todos los productos del catálogo tienen un descuento mayor al <strong>50%</strong>
          sobre el precio de referencia mostrado en la ficha de producto, lo cual los coloca en
          la categoría de <strong>venta final</strong>. Antes de pagar, confirma tu talla con la
          guía disponible en cada producto.
        </p>
      </LegalSection>

      <LegalSection title="2. Producto para aficionados">
        <p>
          Nuestros jerseys son <strong>réplicas de aficionado</strong> inspiradas en los diseños
          de equipos, ligas y selecciones. No son productos oficiales ni licenciados, y no están
          afiliados ni respaldados por los clubes, ligas, federaciones o sus patrocinadores.
          Al comprar declaras que entiendes esta condición, por lo que no procede una devolución
          fundamentada en &quot;no es original&quot;.
        </p>
      </LegalSection>

      <LegalSection title="3. Únicas excepciones (reposición o reembolso)">
        <p>Solo procesamos reposición o reembolso en los siguientes casos:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Producto defectuoso de fábrica</strong> (costuras abiertas, estampado fallido, talla etiquetada incorrectamente).</li>
          <li><strong>Error nuestro en el envío</strong> (te mandamos un jersey distinto al que pediste).</li>
          <li><strong>Paquete dañado en tránsito</strong> (levantamos el reporte con la paquetería y gestionamos un reemplazo).</li>
        </ul>
        <p>
          Para estos casos tienes <strong>48 horas</strong> desde la entrega para escribirnos a
          {" "}<strong>contacto@aurasport.mx</strong> adjuntando fotografías del producto y del
          empaque. Sin esa evidencia no podemos validar el defecto.
        </p>
      </LegalSection>

      <LegalSection title="4. Lo que NO aceptamos">
        <ul className="list-disc pl-6 space-y-1">
          <li>Devolución por cambio de opinión o gusto.</li>
          <li>Cambio de talla (consulta la guía antes de comprar).</li>
          <li>Devoluciones de productos usados, lavados, manchados o sin etiquetas.</li>
          <li>Reclamos fuera del plazo de 48 horas posteriores a la entrega.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. PROFECO">
        <p>
          Si consideras que tu caso no fue atendido correctamente, puedes acudir a la
          Procuraduría Federal del Consumidor (PROFECO):
          {" "}<a href="https://www.gob.mx/profeco" className="underline font-bold">gob.mx/profeco</a>
          {" · "}Tel. <strong>800 468 8722</strong>.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
