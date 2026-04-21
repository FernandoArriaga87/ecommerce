import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | AuraSport",
  description: "Términos de uso del sitio y de compra.",
};

export default function TerminosPage() {
  return (
    <LegalPageShell
      title="Términos y Condiciones"
      subtitle="Uso del sitio y contrato de compraventa"
      lastUpdated="19 de abril de 2026"
    >
      <p className="text-sm bg-[#FFF8E1] border-l-4 border-amber-500 p-4 text-[#111111]/70">
        <strong>Documento base.</strong> Ajusta los datos del comerciante, domicilio fiscal y jurisdicción
        antes de operar. Valida con tu asesor legal.
      </p>

      <LegalSection title="1. Aceptación">
        <p>
          Al usar el sitio <strong>aurasport.mx</strong> o realizar una compra, aceptas estos
          términos y condiciones. Si no estás de acuerdo, no utilices el sitio.
        </p>
      </LegalSection>

      <LegalSection title="2. Datos del comerciante">
        <p>
          <strong>AuraSport</strong><br />
          [Razón social] · RFC: [RFC]<br />
          Domicilio fiscal: [dirección completa]<br />
          Correo: contacto@aurasport.mx
        </p>
      </LegalSection>

      <LegalSection title="3. Cuenta de usuario">
        <ul className="list-disc pl-6 space-y-1">
          <li>Debes ser mayor de edad o contar con autorización de tu tutor legal.</li>
          <li>Eres responsable de la veracidad de los datos que proporcionas.</li>
          <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
          <li>Nos reservamos el derecho de suspender cuentas que violen estos términos o que se usen para fines fraudulentos.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Naturaleza del producto">
        <p>
          Los productos que vendemos son <strong>jerseys de aficionado</strong> (también llamados
          réplicas para aficionado). No son productos oficiales, no están licenciados y no cuentan con
          afiliación, patrocinio ni respaldo de los clubes, ligas, selecciones, federaciones o
          patrocinadores cuyos diseños inspiran nuestras prendas.
        </p>
        <p>
          Los nombres, escudos y referencias visuales a equipos o ligas se utilizan únicamente con
          fines descriptivos para orientar al aficionado sobre el diseño en que se inspira el jersey.
          Todas las marcas citadas son propiedad de sus respectivos titulares.
        </p>
        <p>
          Al confirmar tu pedido declaras que entiendes que estás adquiriendo un producto no oficial.
        </p>
      </LegalSection>

      <LegalSection title="5. Productos, precios e inventario">
        <p>
          Los precios se muestran en pesos mexicanos (MXN) e incluyen IVA cuando aplica. Podemos modificar
          los precios y el catálogo sin previo aviso; el precio aplicable será el vigente al momento de
          confirmar tu pedido.
        </p>
        <p>
          El inventario se reserva al iniciar el pago. Si un producto se agota después, cancelaremos el
          pedido y se devolverá el 100% de lo pagado. En caso de error evidente de precio, nos reservamos
          el derecho de cancelar el pedido y reembolsar.
        </p>
      </LegalSection>

      <LegalSection title="6. Proceso de compra">
        <ol className="list-decimal pl-6 space-y-1">
          <li>Agrega productos al carrito.</li>
          <li>Confirma tu dirección de envío.</li>
          <li>Paga con Stripe. El contrato de compraventa se perfecciona al confirmarse el pago.</li>
          <li>Recibirás un correo de confirmación con tu número de pedido.</li>
        </ol>
      </LegalSection>

      <LegalSection title="7. Pago">
        <p>
          Procesamos pagos exclusivamente a través de Stripe. No almacenamos datos completos de tu tarjeta.
          Si tu banco rechaza el cargo o la sesión de pago expira (30 minutos), el pedido se cancela
          automáticamente y el inventario se libera.
        </p>
      </LegalSection>

      <LegalSection title="8. Envíos">
        <p>
          Consulta tiempos, cobertura y tarifas en nuestra página de
          <a href="/envios" className="underline font-bold"> Envíos</a>. Los tiempos son estimados y
          pueden variar por causas ajenas (paqueterías, clima, zona geográfica).
        </p>
      </LegalSection>

      <LegalSection title="9. Devoluciones (venta final)">
        <p>
          Todos los productos del catálogo se venden con un descuento superior al
          <strong> 50%</strong> sobre su precio de referencia, por lo que califican como
          <strong> venta final</strong>. No aceptamos devoluciones ni cambios por gusto o
          talla. Las únicas excepciones son producto defectuoso, error nuestro en el envío o
          paquete dañado en tránsito, reportados dentro de las 48 horas posteriores a la
          entrega. Consulta el detalle en nuestra
          <a href="/devoluciones" className="underline font-bold"> Política de Devoluciones</a>.
        </p>
      </LegalSection>

      <LegalSection title="10. Propiedad intelectual">
        <p>
          El contenido editorial del sitio (textos, fotografías del producto, código) es propiedad de
          AuraSport. Los nombres, escudos, logotipos, tipografías y demás signos distintivos de
          clubes, ligas, selecciones, federaciones y patrocinadores mencionados en el sitio son
          propiedad de sus respectivos titulares; su uso en este sitio es meramente descriptivo para
          orientar al aficionado sobre la inspiración del diseño y no implica afiliación, licencia ni
          patrocinio.
        </p>
        <p>
          Si consideras que algún contenido infringe tus derechos de propiedad intelectual, escribe a
          <strong> legal@aurasport.mx</strong> y lo revisaremos a la brevedad.
        </p>
      </LegalSection>

      <LegalSection title="11. Conducta del usuario">
        <p>Al usar el sitio te comprometes a no:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Suplantar a otra persona o proporcionar datos falsos.</li>
          <li>Intentar acceder a sistemas, cuentas o datos que no te pertenecen.</li>
          <li>Interferir con el funcionamiento del sitio (scraping masivo, DDoS, etc.).</li>
          <li>Realizar compras con medios de pago no autorizados por su titular.</li>
        </ul>
      </LegalSection>

      <LegalSection title="12. Limitación de responsabilidad">
        <p>
          Hacemos esfuerzos razonables para mantener el sitio disponible y la información correcta. El
          servicio se presta &quot;tal cual&quot;. No somos responsables por daños indirectos derivados del uso del
          sitio más allá del monto pagado por el pedido correspondiente.
        </p>
      </LegalSection>

      <LegalSection title="13. Modificaciones">
        <p>
          Podemos modificar estos términos. La versión vigente es la publicada en este sitio. Tu uso
          continuo del sitio implica aceptación de los cambios.
        </p>
      </LegalSection>

      <LegalSection title="14. Legislación y jurisdicción">
        <p>
          Estos términos se rigen por las leyes mexicanas. Para cualquier controversia, las partes se
          someten a la competencia de los tribunales de [Ciudad, Estado], renunciando a cualquier otro
          fuero. El consumidor puede acudir ante PROFECO conforme a la LFPC.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
