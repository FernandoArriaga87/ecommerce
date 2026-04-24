import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Devoluciones | AuraSport",
  description:
    "Políticas de venta final y excepciones por defectos de fábrica.",
};

export default function DevolucionesPage() {
  return (
    <LegalPageShell
      title="Devoluciones"
      subtitle="Condiciones de venta y reposiciones"
      lastUpdated="23 de abril de 2026"
    >
      <LegalSection title="1. Condiciones de Venta Final">
        <p>
          En AuraSport trabajamos arduamente para ofrecerte prendas de gran calidad a precios sumamente accesibles. 
          Debido a la naturaleza de nuestro negocio (prendas únicas de segunda mano importadas en paca), 
          todas nuestras ventas se consideran <strong>venta final</strong>.
        </p>
        <p className="mt-2">
          Esto significa que no podemos aceptar devoluciones ni realizar cambios por arrepentimiento, 
          cambio de opinión o errores al elegir la talla. Te pedimos amablemente que revises con detalle 
          las medidas y fotografías disponibles en cada producto antes de finalizar tu compra, ya que 
          al ser prendas usadas, las tallas pueden variar ligeramente por el uso o lavado previo.
        </p>
      </LegalSection>

      <LegalSection title="2. Naturaleza de los productos">
        <p>
          Queremos ser completamente transparentes contigo: los artículos que ofrecemos son 
          <strong> camisas y prendas usadas importadas</strong> de Estados Unidos. 
          Al ser ropa de segunda mano (vintage), pueden presentar detalles normales de uso 
          (pequeñas bolitas, desgaste leve en estampados, etc.). Tratamos de documentar cualquier detalle 
          significativo en la descripción, pero al realizar tu pedido aceptas que estás comprando un artículo usado.
        </p>
      </LegalSection>

      <LegalSection title="3. Excepciones: Errores graves o fallas no descritas">
        <p>
          Tu satisfacción es primordial. Aunque revisamos cada prenda antes de publicarla y enviarla, 
          si llegaras a recibir un producto con un daño grave que no fue documentado, lo solucionaremos. 
          Las únicas situaciones en las que procesamos una <strong>reposición (crédito en tienda) o reembolso</strong> son:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4 mb-4">
          <li><strong>Daño no descrito:</strong> Roturas considerables, manchas grandes o quemaduras que no fueron mencionadas en la descripción ni mostradas en las fotos del producto.</li>
          <li><strong>Error en el envío:</strong> Si te enviamos una prenda diferente a la que compraste.</li>
          <li><strong>Daños en tránsito:</strong> Si tu paquete llega visiblemente maltratado, abierto o roto por culpa de la paquetería (es importante documentarlo antes de abrirlo).</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cómo solicitar una revisión">
        <p>
          Si te encuentras en alguno de los casos mencionados en el punto anterior, tienes un plazo 
          máximo de <strong>48 horas</strong> contadas a partir del momento en que la paquetería marca 
          el paquete como "entregado" para reportarlo.
        </p>
        <p className="mt-2">
          Para iniciar el proceso, simplemente envíanos un correo a <strong>contacto@aurasportmx.com</strong>.
          En el correo, por favor incluye:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Tu número de pedido.</li>
          <li>Una descripción clara del problema.</li>
          <li>Fotografías claras donde se aprecie el defecto o el error.</li>
        </ul>
        <p className="mt-2">
          Evaluaremos tu caso a la brevedad y te indicaremos los siguientes pasos para enviarte un reemplazo 
          sin costo adicional o procesar un reembolso si el producto ya no estuviera en stock.
        </p>
      </LegalSection>

      <LegalSection title="5. Artículos no elegibles para revisión">
        <p>
          Por cuestiones de higiene y control de calidad, cualquier prenda que muestre señales de haber 
          sido usada, lavada, alterada, que huela a perfume/desodorante, o a la cual se le hayan desprendido 
          sus etiquetas originales, perderá automáticamente cualquier derecho a revisión por defecto de fábrica.
        </p>
      </LegalSection>

      <LegalSection title="6. Datos de contacto para devoluciones">
        <p>
          <strong>AuraSport</strong><br />
          Para el envío físico de devoluciones autorizadas o cualquier notificación legal relacionada:<br />
          Av. Constitución 1234, Local 5, Col. Centro, Monterrey, N.L., C.P. 64000, México<br />
          Correo electrónico: contacto@aurasportmx.com
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
