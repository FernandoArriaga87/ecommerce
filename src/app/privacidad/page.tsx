import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | AuraSport",
  description: "Cómo manejamos la información en nuestro sitio.",
};

export default function PrivacidadPage() {
  return (
    <LegalPageShell
      title="Aviso de Privacidad"
      subtitle="Transparencia y seguridad"
      lastUpdated="23 de abril de 2026"
    >
      <LegalSection title="1. Identidad del responsable">
        <p>
          <strong>AuraSport</strong>, con domicilio en Av. Constitución 1234, Local 5, Col. Centro, Monterrey, N.L., C.P. 64000, México, 
          se compromete a mantener la confidencialidad y seguridad de la información de sus clientes, 
          aplicando las medidas necesarias para garantizar una experiencia de navegación y compra segura.
        </p>
        <p className="mt-2">
          Para cualquier consulta relacionada con este aviso, puedes contactarnos en: <strong>contacto@aurasportmx.com</strong>
        </p>
      </LegalSection>

      <LegalSection title="2. Información en nuestro sitio">
        <p>
          Al navegar por nuestra tienda y realizar una compra, el sistema requiere procesar ciertos detalles básicos 
          para asegurar que los pedidos lleguen a su destino correctamente, como el lugar de entrega y un correo de contacto 
          para enviar las actualizaciones del envío.
        </p>
        <p className="mt-2">
          <strong>No solicitamos, no recopilamos ni almacenamos datos personales sensibles.</strong> 
          No requerimos información de identificación oficial, estado civil, ni datos biométricos. 
          Mantenemos la recolección de información al mínimo indispensable requerido únicamente para fines de logística y envío.
        </p>
      </LegalSection>

      <LegalSection title="3. Seguridad de los pagos">
        <p>
          La seguridad de tus transacciones es una prioridad. Todos los pagos realizados en nuestra plataforma 
          son procesados de forma externa a través de pasarelas de pago certificadas (como Stripe). 
        </p>
        <p className="mt-2">
          AuraSport <strong>nunca almacena, procesa ni tiene acceso a los números completos de tu tarjeta de crédito o débito</strong>, 
          ni a los códigos de seguridad (CVV). Todo el proceso de pago ocurre en un entorno encriptado bajo los más altos 
          estándares de seguridad bancaria (PCI-DSS).
        </p>
      </LegalSection>

      <LegalSection title="4. Uso de la información">
        <p>Los detalles proporcionados durante la compra se utilizan exclusivamente para:</p>
        <ul className="list-disc pl-6 space-y-2 mt-2 mb-2">
          <li>Coordinar el despacho y envío del paquete a la dirección indicada.</li>
          <li>Enviar correos electrónicos automáticos sobre el estado del pedido (confirmación, envío y entrega).</li>
          <li>Brindar soporte técnico o asistencia en caso de que existan dudas con el pedido.</li>
        </ul>
        <p>
          <strong>En AuraSport nunca venderemos, rentaremos ni compartiremos tu información con terceros con fines publicitarios.</strong> 
          Solo compartimos la dirección de destino con las paqueterías estrictamente para lograr la entrega del paquete.
        </p>
      </LegalSection>

      <LegalSection title="5. Cookies y navegación">
        <p>
          Nuestro sitio web puede utilizar herramientas analíticas estándar (cookies) que nos ayudan a entender 
          de forma anónima y agregada cómo los visitantes navegan por nuestro catálogo, cuáles son los artículos 
          más populares y cómo podemos mejorar la velocidad y diseño de nuestra página. Estas herramientas no rastrean 
          tu identidad personal.
        </p>
      </LegalSection>

      <LegalSection title="6. Modificaciones">
        <p>
          Este aviso de privacidad puede ser actualizado en el futuro para adaptarse a mejoras en nuestra plataforma 
          o a nuevas disposiciones legales. Cualquier cambio será publicado en esta misma sección para mantener una total 
          transparencia con nuestros clientes.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
