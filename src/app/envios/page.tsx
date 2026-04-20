import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Envíos | DeportivoStore",
  description: "Tiempos, cobertura y costos de envío.",
};

export default function EnviosPage() {
  return (
    <LegalPageShell
      title="Envíos"
      subtitle="Tiempos, cobertura y costos"
      lastUpdated="19 de abril de 2026"
    >
      <LegalSection title="Envío gratis">
        <p>
          Todos los pedidos iguales o mayores a <strong>$1,499 MXN</strong> incluyen envío estándar sin
          costo dentro de la República Mexicana. No aplica para destinos internacionales ni zonas
          extendidas.
        </p>
      </LegalSection>

      <LegalSection title="Tiempos de entrega">
        <div className="border border-[#111111]/10 divide-y divide-[#111111]/10 text-sm">
          <div className="p-4 flex justify-between items-center bg-[#F7F7F7]">
            <span className="font-black uppercase tracking-widest text-xs">Estándar</span>
            <span className="text-[#111111]/70">3 a 5 días hábiles</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="font-black uppercase tracking-widest text-xs">Express</span>
            <span className="text-[#111111]/70">1 a 2 días hábiles (próximamente)</span>
          </div>
          <div className="p-4 flex justify-between items-center bg-[#F7F7F7]">
            <span className="font-black uppercase tracking-widest text-xs">Zonas extendidas</span>
            <span className="text-[#111111]/70">5 a 8 días hábiles</span>
          </div>
        </div>
        <p className="text-xs text-[#111111]/60 mt-2">
          El tiempo se cuenta a partir del día siguiente a la confirmación de pago, de lunes a viernes.
        </p>
      </LegalSection>

      <LegalSection title="Costos">
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Pedidos &gt; $1,499 MXN:</strong> gratis.</li>
          <li><strong>Pedidos &lt; $1,499 MXN:</strong> $149 MXN estándar.</li>
          <li>Zonas extendidas pueden tener cargo adicional que se calcula al confirmar dirección.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Cobertura">
        <p>
          Enviamos a las 32 entidades de la República Mexicana. Para envíos internacionales, escríbenos
          a <strong>contacto@deportivostore.mx</strong> y te daremos una cotización.
        </p>
      </LegalSection>

      <LegalSection title="Rastreo">
        <p>
          Cuando tu pedido salga del almacén, recibirás un correo con el número de guía y la paquetería.
          También puedes ver el estado en la sección <a href="/orders" className="underline font-bold">Mis pedidos</a>.
        </p>
      </LegalSection>

      <LegalSection title="Problemas con tu envío">
        <p>
          Si tu paquete no llega en el tiempo estimado, si llega dañado o si aparece como entregado pero
          no lo recibiste, escríbenos a <strong>contacto@deportivostore.mx</strong> o consulta nuestra
          <a href="/devoluciones" className="underline font-bold"> Política de Devoluciones</a>.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
