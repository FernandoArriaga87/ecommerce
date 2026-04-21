/**
 * Skydropx Pro API client.
 *
 * Auth: OAuth2 client_credentials. Token is cached in-memory until it expires.
 *
 * Env vars:
 *   SKYDROPX_API_URL       (default: https://pro.skydropx.com/api/v1)
 *   SKYDROPX_API_KEY       → client_id
 *   SKYDROPX_API_SECRET    → client_secret
 *   SKYDROPX_ORIGIN_ZIP    (default: 64640)
 *   SKYDROPX_WEBHOOK_SECRET
 */

const API_URL = process.env.SKYDROPX_API_URL || "https://pro.skydropx.com/api/v1";
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

  const res = await fetch(`${API_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
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
      address_from: { country_code: "mx", postal_code: ORIGIN_ZIP },
      address_to: { country_code: "mx", postal_code: destZip },
      parcel: {
        weight,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
      },
      requested_carriers: [],
    },
  };

  const json = await skydropxFetch("/quotations", {
    method: "POST",
    body: JSON.stringify(body),
  });

  // Skydropx returns quotation with rates[]. Each rate has id, provider_name, days, amount_local, etc.
  const rates: Array<{
    id: string;
    provider_name?: string;
    provider?: string;
    service_level_name?: string;
    days?: number;
    amount_local?: string | number;
    currency_local?: string;
    total_pricing?: string | number;
    currency?: string;
  }> = json?.data?.attributes?.rates || json?.rates || [];

  return rates.map((r) => {
    const price = Number(r.amount_local ?? r.total_pricing ?? 0);
    const days = r.days ?? 5;
    return {
      rateId: String(r.id),
      carrier: r.provider_name || r.provider || "Paquetería",
      serviceLevel: r.service_level_name || "Estándar",
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
}): Promise<CreatedShipment> {
  const body = {
    shipment: {
      rate_id: params.rateId,
      reference: params.orderNumber,
      address_to: {
        name: params.destination.name,
        street1: params.destination.street1,
        city: params.destination.city,
        province: params.destination.province,
        country_code: "mx",
        postal_code: params.destination.zip,
        phone: params.destination.phone,
        email: params.destination.email,
      },
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
