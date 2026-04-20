import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies | DeportivoStore",
  description: "Qué cookies usamos y cómo puedes administrarlas.",
};

export default function CookiesPage() {
  return (
    <LegalPageShell
      title="Política de Cookies"
      subtitle="Transparencia sobre el uso de cookies"
      lastUpdated="19 de abril de 2026"
    >
      <LegalSection title="1. ¿Qué son las cookies?">
        <p>
          Las cookies son pequeños archivos de texto que los sitios web colocan en tu dispositivo
          mientras navegas. Sirven para recordar preferencias, mantener tu sesión iniciada y entender
          cómo se usa el sitio.
        </p>
      </LegalSection>

      <LegalSection title="2. Cookies que usamos">
        <div className="border border-[#111111]/10 divide-y divide-[#111111]/10 text-sm">
          <div className="p-4 bg-[#F7F7F7]">
            <p className="font-black uppercase tracking-widest text-xs mb-1">Esenciales</p>
            <p className="text-[#111111]/70">
              Necesarias para que funcione el sitio: sesión de usuario (Supabase), carrito, preferencias
              básicas. No requieren consentimiento.
            </p>
          </div>
          <div className="p-4">
            <p className="font-black uppercase tracking-widest text-xs mb-1">Funcionales</p>
            <p className="text-[#111111]/70">
              Recuerdan decisiones que tomas (idioma, tallas recientes). Mejoran tu experiencia pero no
              son imprescindibles.
            </p>
          </div>
          <div className="p-4 bg-[#F7F7F7]">
            <p className="font-black uppercase tracking-widest text-xs mb-1">Analíticas</p>
            <p className="text-[#111111]/70">
              Nos ayudan a entender qué productos se ven más y cómo se comportan los visitantes
              (agregadas, sin identificarte).
            </p>
          </div>
          <div className="p-4">
            <p className="font-black uppercase tracking-widest text-xs mb-1">Terceros</p>
            <p className="text-[#111111]/70">
              Stripe (procesamiento de pago) puede instalar cookies propias en la página de checkout
              para prevenir fraude.
            </p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="3. Cómo administrar tus cookies">
        <p>
          Puedes aceptar o rechazar las cookies no esenciales desde el banner que aparece en tu primera
          visita. También puedes:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Configurar tu navegador para bloquear todas las cookies o eliminarlas al cerrar sesión.</li>
          <li>Navegar en modo incógnito/privado (las cookies se borran al cerrar la ventana).</li>
          <li>Limpiar tu almacenamiento local desde las herramientas del navegador.</li>
        </ul>
        <p className="text-sm text-[#111111]/60">
          Nota: bloquear cookies esenciales puede impedir que inicies sesión o que se guarde tu carrito.
        </p>
      </LegalSection>

      <LegalSection title="4. Cambios">
        <p>
          Actualizaremos esta política cuando agreguemos o quitemos herramientas. La fecha de la última
          revisión aparece al inicio.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
