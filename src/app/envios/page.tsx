import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Envíos | AuraSport",
  description: "Tiempos, cobertura y costos de envío.",
};

export default function EnviosPage() {
  return (
    <LegalPageShell
      title="Envíos"
      subtitle="Tiempos, cobertura y costos"
      lastUpdated="23 de abril de 2026"
    >
      <LegalSection title="1. Envío gratis">
        <p>
          Todos los pedidos iguales o mayores a <strong>$1,499 MXN</strong> incluyen envío estándar sin
          costo a cualquier parte de la República Mexicana. Esta es nuestra forma de agradecer tu preferencia. 
          El descuento de envío se aplicará automáticamente en la pantalla de pago al alcanzar el monto requerido.
        </p>
      </LegalSection>

      <LegalSection title="2. Tiempos de entrega">
        <div className="border border-[#111111]/10 divide-y divide-[#111111]/10 text-sm mb-4">
          <div className="p-4 flex justify-between items-center bg-[#F7F7F7]">
            <span className="font-black uppercase tracking-widest text-xs">Estándar</span>
            <span className="text-[#111111]/70">3 a 5 días hábiles</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="font-black uppercase tracking-widest text-xs">Express</span>
            <span className="text-[#111111]/70">1 a 2 días hábiles (Sujeto a disponibilidad)</span>
          </div>
          <div className="p-4 flex justify-between items-center bg-[#F7F7F7]">
            <span className="font-black uppercase tracking-widest text-xs">Zonas extendidas</span>
            <span className="text-[#111111]/70">5 a 8 días hábiles</span>
          </div>
        </div>
        <p className="text-xs text-[#111111]/60 mt-2">
          El tiempo de entrega comienza a contar a partir del día hábil siguiente a la confirmación de tu pago. 
          Nuestro equipo de almacén en Monterrey prepara los paquetes de lunes a viernes. Los fines de semana 
          y días festivos oficiales no cuentan como días hábiles para el tránsito de las paqueterías.
        </p>
      </LegalSection>

      <LegalSection title="3. Costos y zonas de cobertura">
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Pedidos mayores a $1,499 MXN:</strong> Envío estándar totalmente gratis.</li>
          <li><strong>Pedidos menores a $1,499 MXN:</strong> Costo fijo de $149 MXN para envío estándar.</li>
          <li><strong>Zonas extendidas:</strong> Algunas poblaciones alejadas de los centros urbanos principales pueden requerir tiempos de entrega mayores.</li>
        </ul>
        <p>
          Actualmente realizamos envíos a las 32 entidades de la República Mexicana. Todos nuestros envíos 
          se realizan a través de paqueterías seguras y reconocidas para garantizar que tu producto llegue en 
          perfectas condiciones.
        </p>
      </LegalSection>

      <LegalSection title="4. Proceso de empaque y rastreo">
        <p>
          Cuidamos cada detalle. Tu jersey se empaca cuidadosamente para evitar daños durante el trayecto. 
          Una vez que el paquete es recolectado por la paquetería en nuestras instalaciones, recibirás un 
          correo electrónico automático con tu número de guía y un enlace para que puedas rastrearlo en tiempo real.
        </p>
      </LegalSection>

      <LegalSection title="5. Problemas o retrasos con el envío">
        <p>
          Sabemos lo importante que es recibir tu pedido a tiempo. Si notas que tu paquete tiene un retraso 
          inusual según el tiempo estimado, o si la paquetería reporta algún inconveniente en la entrega, 
          estamos aquí para ayudarte.
        </p>
        <p className="mt-2">
          Escríbenos directamente a <strong>contacto@aurasportmx.com</strong> incluyendo tu número de pedido. 
          Nosotros nos encargaremos de contactar a la paquetería para resolver la situación lo antes posible.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
