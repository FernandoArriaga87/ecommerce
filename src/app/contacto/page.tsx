import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto | DeportivoStore",
  description: "Canales de atención a clientes.",
};

export default function ContactoPage() {
  return (
    <LegalPageShell
      title="Contacto"
      subtitle="Estamos para ayudarte"
      lastUpdated="19 de abril de 2026"
    >
      <LegalSection title="Atención a clientes">
        <p>
          Nuestro equipo responde de <strong>lunes a viernes de 9:00 a 18:00 hrs</strong> (hora del
          centro de México). Los correos fuera de horario los atendemos el siguiente día hábil.
        </p>
      </LegalSection>

      <LegalSection title="Correos según tu duda">
        <div className="border border-[#111111]/10 divide-y divide-[#111111]/10 text-sm">
          <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-[#F7F7F7]">
            <span className="font-black uppercase tracking-widest text-xs">Pedidos y envíos</span>
            <a href="mailto:contacto@deportivostore.mx" className="underline font-bold">contacto@deportivostore.mx</a>
          </div>
          <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="font-black uppercase tracking-widest text-xs">Devoluciones</span>
            <a href="mailto:devoluciones@deportivostore.mx" className="underline font-bold">devoluciones@deportivostore.mx</a>
          </div>
          <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-[#F7F7F7]">
            <span className="font-black uppercase tracking-widest text-xs">Privacidad (ARCO)</span>
            <a href="mailto:privacidad@deportivostore.mx" className="underline font-bold">privacidad@deportivostore.mx</a>
          </div>
          <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="font-black uppercase tracking-widest text-xs">Prensa y alianzas</span>
            <a href="mailto:prensa@deportivostore.mx" className="underline font-bold">prensa@deportivostore.mx</a>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="Antes de escribirnos">
        <p>La respuesta llega más rápido si revisas primero:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><a href="/envios" className="underline font-bold">Tiempos y costos de envío</a>.</li>
          <li><a href="/devoluciones" className="underline font-bold">Cómo devolver o cambiar</a>.</li>
          <li>El estado de tu pedido en <a href="/orders" className="underline font-bold">Mis pedidos</a>.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Si tu correo es sobre un pedido">
        <p>Incluye esta información para agilizar la atención:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Número de pedido (aparece en el correo de confirmación).</li>
          <li>Nombre con el que se realizó la compra.</li>
          <li>Descripción breve del problema y, si aplica, fotos.</li>
        </ul>
      </LegalSection>
    </LegalPageShell>
  );
}
