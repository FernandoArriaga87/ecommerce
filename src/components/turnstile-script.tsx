import { headers } from "next/headers";

// Server component: emite el <script> oficial de Turnstile con el nonce CSP
// inyectado por el middleware. Necesario porque el CSP usa `strict-dynamic`:
// sólo scripts con nonce pueden cargar scripts hijos (el iframe de Cloudflare).
//
// Si NEXT_PUBLIC_TURNSTILE_SITE_KEY no está configurado, no emite nada.
export async function TurnstileScript() {
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return null;
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js"
      async
      defer
      nonce={nonce}
    />
  );
}
