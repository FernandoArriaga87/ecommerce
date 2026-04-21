/**
 * Skydropx Pro API client.
 *
 * Auth: OAuth2 client_credentials (form-urlencoded). Token is cached in-memory until it expires.
 *
 * Environments:
 *   Production: https://pro.skydropx.com/api/v1
 *   Sandbox:    https://sb-pro.skydropx.com/api/v1   ← credenciales de prueba
 *
 * Env vars:
 *   SKYDROPX_API_URL       (optional; if unset, derived from SKYDROPX_ENV)
 *   SKYDROPX_ENV           "sandbox" | "production" (default: "sandbox")
 *   SKYDROPX_API_KEY       → client_id
 *   SKYDROPX_API_SECRET    → client_secret
 *   SKYDROPX_ORIGIN_ZIP    (default: 64640)
 *   SKYDROPX_WEBHOOK_TOKEN token enviado en header "admin: Bearer <token>" por el webhook
 */

function resolveApiUrl(): string {
  const url = process.env.SKYDROPX_API_URL;
  if (url) {
    // Si traen una URL legacy, forzamos Sandbox Pro para que funcione OAuth
    if (url.includes("api-demo.skydropx.com")) {
      console.warn("Detectada URL legacy de Skydropx en SKYDROPX_API_URL. Forzando host Pro Sandbox.");
      return "https://sb-pro.skydropx.com/api/v1";
    }
    return url;
  }
  const env = (process.env.SKYDROPX_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://pro.skydropx.com/api/v1"
    : "https://sb-pro.skydropx.com/api/v1";
}

const API_URL = resolveApiUrl();
const ORIGIN_ZIP = process.env.SKYDROPX_ORIGIN_ZIP || "64640";

// Nuevo León ZIP range: 64000–67999
const NL_ZIP_REGEX = /^6[4567]\d{3}$/;
const NL_FLAT_PRICE = 100;

// Default package for a single jersey: 1 kg, 30×30×10 cm
export const DEFAULT_PACKAGE = { weight: 1, length: 30, width: 30, height: 10 } as const;

export function isNuevoLeonZip(zip: string): boolean {
  return NL_ZIP_REGEX.test(zip.trim());
}

// ──────────── Token cache ────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const apiKey = process.env.SKYDROPX_API_KEY;
  const apiSecret = process.env.SKYDROPX_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("SKYDROPX_API_KEY and SKYDROPX_API_SECRET must be set");
  }

  // OAuth2 RFC 6749: the token endpoint expects application/x-www-form-urlencoded.
  // Skydropx Pro rejects JSON bodies with invalid_client / "método de autenticación incompatible".
  const formBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: apiKey,
    client_secret: apiSecret,
  });

  const res = await fetch(`${API_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: formBody.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    // Clear any stale cache and surface a clean error. Never log the secret.
    cachedToken = null;
    if (res.status === 401) {
      throw new Error(
        `Skydropx auth 401: verifica que SKYDROPX_API_KEY y SKYDROPX_API_SECRET ` +
        `sean credenciales válidas y correspondan al ambiente de SKYDROPX_API_URL ` +
        `(actual: ${API_URL}). Respuesta: ${text}`
      );
    }
    throw new Error(`Skydropx token fetch failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

async function skydropxFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Skydropx ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// ──────────── Types ────────────

export type ShippingOption = {
  rateId: string;
  carrier: string;          // "Estafeta", "DHL", "Entrega Personal (NL)"
  serviceLevel: string;     // "Terrestre", "Express"
  price: number;            // MXN
  currency: "MXN";
  daysMin: number;
  daysMax: number;
  isPersonalDelivery: boolean;
};

export type QuoteInput = {
  destinationZip: string;
  destinationState?: string;
  destinationCity?: string;
  destinationAddress?: string;
  totalItems: number;       // used to scale package weight
  packageOverride?: Partial<typeof DEFAULT_PACKAGE>;
};

// ──────────── Quote ────────────

/**
 * Returns a list of shipping options for the given destination.
 * - If destination is in Nuevo León: returns a single flat-rate option ($100).
 * - Otherwise: queries Skydropx and returns all available rates.
 */
export async function quoteShipping(input: QuoteInput): Promise<ShippingOption[]> {
  const destZip = input.destinationZip.trim();

  if (isNuevoLeonZip(destZip)) {
    return [
      {
        rateId: "NL_PERSONAL",
        carrier: "Entrega Personal (Nuevo León)",
        serviceLevel: "Local",
        price: NL_FLAT_PRICE,
        currency: "MXN",
        daysMin: 1,
        daysMax: 2,
        isPersonalDelivery: true,
      },
    ];
  }

  const pkg = { ...DEFAULT_PACKAGE, ...input.packageOverride };
  // Scale weight by number of items (playera = 1 kg each by default)
  const weight = pkg.weight * Math.max(1, input.totalItems);

  const body = {
    quotation: {
      address_from: { 
        country_code: "mx", 
        postal_code: ORIGIN_ZIP,
        area_level1: "Nuevo León",
        area_level2: "Monterrey",
        area_level3: "Centro"
      },
      address_to: { 
        country_code: "mx", 
        postal_code: destZip,
        area_level1: input.destinationState || "Estado",
        area_level2: input.destinationCity || "Ciudad",
        area_level3: input.destinationAddress || "Colonia"
      },
      parcel: {
        weight,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
      },
      requested_carriers: [],
    },
  };

  let json = await skydropxFetch("/quotations", {
    method: "POST",
    body: JSON.stringify(body),
  });

  // Poll until quotation is completed
  const quoteId = json?.data?.id || json?.id;
  let isCompleted = json?.data?.attributes?.is_completed ?? json?.is_completed ?? true;
  let attempts = 0;

  while (!isCompleted && attempts < 10 && quoteId) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000));
    json = await skydropxFetch(`/quotations/${quoteId}`);
    isCompleted = json?.data?.attributes?.is_completed ?? json?.is_completed ?? false;
  }

  // Skydropx returns quotation with rates[]. Each rate has id, provider_name, days, amount, total, etc.
  const rates: Array<{
    id: string;
    provider_name?: string;
    provider_display_name?: string;
    provider?: string;
    provider_service_name?: string;
    service_level_name?: string;
    days?: number;
    amount?: string | number;
    amount_local?: string | number;
    total?: string | number;
    total_pricing?: string | number;
  }> = json?.data?.attributes?.rates || json?.rates || [];

  return rates
    .filter(r => r.total || r.amount || r.total_pricing || r.amount_local) // Sólo mostrar si tienen precio
    .map((r) => {
      const price = Number(r.total ?? r.amount ?? r.total_pricing ?? r.amount_local ?? 0);
      const days = r.days ?? 5;
      return {
        rateId: String(r.id),
        carrier: r.provider_display_name || r.provider_name || r.provider || "Paquetería",
        serviceLevel: r.provider_service_name || r.service_level_name || "Estándar",
        price,
        currency: "MXN" as const,
        daysMin: days,
        daysMax: days + 2,
        isPersonalDelivery: false,
      };
    });
}

// ──────────── Create shipment ────────────

export type CreatedShipment = {
  shipmentId: string;
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
};

/**
 * Creates a shipment from a previously-chosen rate.
 * Call this AFTER the customer pays (inside the Stripe webhook).
 */
export async function createShipment(params: {
  rateId: string;
  destination: {
    name: string;
    street1: string;
    city: string;
    province: string;
    zip: string;
    phone: string;
    email: string;
  };
  orderNumber: string;
  totalItems: number;
}): Promise<CreatedShipment> {
  const weight = DEFAULT_PACKAGE.weight * Math.max(1, params.totalItems);

  const body = {
    shipment: {
      rate_id: params.rateId,
      reference: params.orderNumber,
      address_to: {
        reference: "Cliente",
        name: params.destination.name,
        street1: params.destination.street1,
        area_level1: params.destination.province,
        area_level2: params.destination.city,
        area_level3: params.destination.city, // Checkout form might not have a separate 'colonia' field, duplicating city is usually accepted or generic fallback.
        country_code: "mx",
        postal_code: params.destination.zip,
        phone: params.destination.phone,
        email: params.destination.email,
      },
      address_from: {
        reference: "Almacen Principal",
        name: "Tienda Deportes",
        street1: "Centro",
        area_level1: "Nuevo León",
        area_level2: "Monterrey",
        area_level3: "Centro",
        country_code: "mx",
        postal_code: ORIGIN_ZIP,
        phone: "8180000000",
        email: "hola@tienda.com",
      },
      packages: [
        {
          package_number: 1,
          weight: weight,
          length: DEFAULT_PACKAGE.length,
          width: DEFAULT_PACKAGE.width,
          height: DEFAULT_PACKAGE.height,
          consignment_note: "53131600", // Ropa
          package_type: "4G" // Caja de cartón
        }
      ]
    },
  };

  const json = await skydropxFetch("/shipments", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = json?.data?.attributes || json;

  return {
    shipmentId: String(json?.data?.id || data?.id),
    trackingNumber: data?.tracking_number || "",
    trackingUrl: data?.tracking_url_provider || data?.tracking_url || "",
    labelUrl: data?.label_url || data?.label || "",
  };
}
