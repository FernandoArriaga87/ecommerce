import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | DeportivoStore",
  description: "Cómo recopilamos, usamos y protegemos tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <LegalPageShell
      title="Aviso de Privacidad"
      subtitle="Protección de datos personales"
      lastUpdated="19 de abril de 2026"
    >
      <p className="text-sm bg-[#FFF8E1] border-l-4 border-amber-500 p-4 text-[#111111]/70">
        <strong>Documento base.</strong> Antes de publicar esta tienda, reemplaza los datos del responsable
        (nombre legal, domicilio, RFC, correo de contacto) y valida el contenido con un asesor legal.
      </p>

      <LegalSection title="1. Responsable del tratamiento">
        <p>
          <strong>DeportivoStore</strong> (en adelante &quot;el Responsable&quot;), con domicilio en [Calle, Número, Colonia,
          C.P., Ciudad, Estado, México], es responsable del tratamiento de los datos personales que
          recabe a través de este sitio web, en los términos de la Ley Federal de Protección de Datos
          Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.
        </p>
        <p>Para cualquier duda relacionada con este aviso, escribe a: <strong>privacidad@deportivostore.mx</strong></p>
      </LegalSection>

      <LegalSection title="2. Datos personales que recabamos">
        <p>Cuando creas una cuenta o realizas una compra, podemos recabar:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Identificación:</strong> nombre completo, correo electrónico, teléfono.</li>
          <li><strong>Dirección de envío:</strong> calle, número, colonia, C.P., ciudad, estado.</li>
          <li><strong>Datos de pago:</strong> procesados directamente por Stripe; no almacenamos el número completo de tu tarjeta en nuestros servidores.</li>
          <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas, mediante cookies (ver nuestra <a href="/cookies" className="underline font-bold">Política de Cookies</a>).</li>
        </ul>
        <p>No recabamos datos personales sensibles.</p>
      </LegalSection>

      <LegalSection title="3. Finalidades del tratamiento">
        <p><strong>Finalidades primarias</strong> (necesarias para la relación comercial):</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Procesar y entregar tus pedidos.</li>
          <li>Gestionar tu cuenta y acceso a compras.</li>
          <li>Emitir comprobantes fiscales cuando los solicites.</li>
          <li>Atender devoluciones, quejas y aclaraciones.</li>
          <li>Cumplir obligaciones legales y fiscales.</li>
        </ul>
        <p className="mt-3"><strong>Finalidades secundarias</strong> (requieren tu consentimiento):</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Envío de promociones y boletines comerciales.</li>
          <li>Análisis estadístico para mejorar nuestros productos y el sitio.</li>
        </ul>
        <p>Puedes negarte en cualquier momento enviando un correo a <strong>privacidad@deportivostore.mx</strong>.</p>
      </LegalSection>

      <LegalSection title="4. Transferencias de datos">
        <p>Tus datos pueden ser compartidos con los siguientes terceros, estrictamente para operar el servicio:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Stripe</strong> (procesamiento de pagos) — sujeto a su propia política de privacidad.</li>
          <li><strong>Supabase</strong> (autenticación e infraestructura).</li>
          <li><strong>Resend</strong> (envío de correos transaccionales).</li>
          <li><strong>Paqueterías</strong> autorizadas para entregar tu pedido.</li>
          <li>Autoridades competentes cuando exista requerimiento legal.</li>
        </ul>
        <p>No vendemos tus datos personales a terceros.</p>
      </LegalSection>

      <LegalSection title="5. Derechos ARCO">
        <p>
          Tienes derecho a <strong>Acceder, Rectificar, Cancelar u Oponerte</strong> al tratamiento de tus datos
          (derechos ARCO). También puedes revocar tu consentimiento. Para ejercerlos, envía a
          <strong> privacidad@deportivostore.mx</strong> una solicitud que incluya:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Tu nombre completo y correo de contacto.</li>
          <li>Documento oficial que acredite tu identidad.</li>
          <li>Descripción clara del derecho que quieres ejercer y sobre qué datos.</li>
        </ul>
        <p>Responderemos en un plazo máximo de 20 días hábiles.</p>
      </LegalSection>

      <LegalSection title="6. Conservación y seguridad">
        <p>
          Conservamos tus datos durante el tiempo necesario para cumplir las finalidades descritas y las
          obligaciones legales aplicables (por ejemplo, 5 años para información fiscal). Aplicamos medidas
          técnicas y administrativas razonables para proteger tu información: cifrado en tránsito (HTTPS),
          acceso restringido, auditoría de procesos y copias de seguridad.
        </p>
      </LegalSection>

      <LegalSection title="7. Uso de cookies">
        <p>
          Este sitio utiliza cookies propias y de terceros. Consulta nuestra
          <a href="/cookies" className="underline font-bold"> Política de Cookies</a> para más detalles.
        </p>
      </LegalSection>

      <LegalSection title="8. Cambios al aviso">
        <p>
          Este aviso puede actualizarse. La fecha de la última versión aparece al inicio del documento.
          Publicaremos los cambios en esta misma página.
        </p>
      </LegalSection>

      <LegalSection title="9. INAI">
        <p>
          Si consideras que tu derecho a la protección de datos personales ha sido vulnerado, puedes
          presentar una denuncia ante el Instituto Nacional de Transparencia, Acceso a la Información
          y Protección de Datos Personales (INAI): <a href="https://home.inai.org.mx" className="underline font-bold">home.inai.org.mx</a>.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
