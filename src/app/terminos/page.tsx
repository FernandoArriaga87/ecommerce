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
      lastUpdated="23 de abril de 2026"
    >
      <LegalSection title="1. Aceptación">
        <p>
          Al usar el sitio <strong>aurasport.mx</strong> o realizar una compra, aceptas estos
          términos y condiciones. Si no estás de acuerdo con alguna de las políticas aquí descritas, 
          te invitamos a no utilizar el sitio. Nos reservamos el derecho de actualizar estos términos 
          en cualquier momento para reflejar cambios operativos o legales.
        </p>
      </LegalSection>

      <LegalSection title="2. Uso del sitio web">
        <ul className="list-disc pl-6 space-y-1">
          <li>El acceso a nuestro catálogo y la navegación son completamente gratuitos.</li>
          <li>Los usuarios se comprometen a hacer un uso adecuado del sitio, sin intentar vulnerar la seguridad ni afectar el rendimiento de la plataforma.</li>
          <li>Cualquier intento de fraude o actividad maliciosa resultará en la cancelación de los pedidos asociados y el bloqueo del acceso al sitio.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Naturaleza del producto">
        <p>
          Los productos que vendemos son <strong>camisas y prendas deportivas usadas importadas</strong>, 
          cuidadosamente seleccionadas e importadas de pacas estadounidenses. Debido a su naturaleza 
          de segunda mano (vintage/pre-loved), las prendas pueden presentar ligeras señales de uso, 
          desgaste natural o pequeños detalles estéticos propios del tiempo.
        </p>
        <p>
          Hacemos un esfuerzo por revisar exhaustivamente cada pieza y garantizar su calidad. 
          Al confirmar tu pedido, declaras que entiendes que estás adquiriendo un artículo de segunda mano 
          y no uno nuevo de fábrica. Promovemos la moda circular y sustentable dándole una segunda vida a prendas de gran calidad.
        </p>
      </LegalSection>

      <LegalSection title="4. Productos, tallas e inventario">
        <p>
          Hacemos un gran esfuerzo por mostrar los colores y diseños con la mayor precisión posible, 
          sin embargo, los colores pueden variar ligeramente dependiendo de la pantalla de tu dispositivo. 
          Recomendamos encarecidamente consultar la guía de tallas antes de realizar cualquier compra, 
          ya que las medidas pueden variar respecto a otras marcas.
        </p>
        <p>
          El inventario está sujeto a disponibilidad. En el caso extraordinario de que un producto 
          se agote después de haberse procesado tu pago, te lo notificaremos a la brevedad y procederemos 
          con el reembolso total de tu compra de manera inmediata.
        </p>
      </LegalSection>

      <LegalSection title="5. Proceso de compra y pagos">
        <p>
          Para realizar una compra, simplemente selecciona tus artículos, agrégalos al carrito y sigue el proceso de pago seguro. 
          Procesamos todos nuestros pagos de forma cifrada a través de pasarelas de pago reconocidas internacionalmente. 
          No almacenamos información sensible de tarjetas de crédito o débito.
        </p>
        <p>
          Los precios se muestran en pesos mexicanos (MXN) y pueden cambiar sin previo aviso. El precio que se te respetará 
          es el que se encuentre vigente en el momento exacto en el que confirmes tu pedido y se procese el pago.
        </p>
      </LegalSection>

      <LegalSection title="6. Envíos y tiempos de entrega">
        <p>
          Procesamos los pedidos lo más rápido posible. Una vez que tu pedido sea despachado desde nuestro almacén en Nuevo León, 
          recibirás un correo con la información de rastreo. Los tiempos de entrega dependen de la zona geográfica y la paquetería, 
          por lo que son aproximados y pueden variar por condiciones climáticas o logísticas ajenas a AuraSport.
        </p>
      </LegalSection>

      <LegalSection title="7. Propiedad intelectual">
        <p>
          El contenido editorial del sitio, fotografías de producto creadas por nosotros, diseño y estructura, 
          son propiedad exclusiva de AuraSport. El uso no autorizado de este material está estrictamente prohibido.
        </p>
      </LegalSection>

      <LegalSection title="8. Legislación y jurisdicción">
        <p>
          Estos términos se rigen por las leyes mexicanas vigentes. Para cualquier controversia relacionada 
          con la interpretación o cumplimiento de estos términos, las partes se someterán a la jurisdicción de 
          los tribunales competentes de Monterrey, Nuevo León, renunciando a cualquier otro fuero que pudiera 
          corresponderles por sus domicilios presentes o futuros.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
