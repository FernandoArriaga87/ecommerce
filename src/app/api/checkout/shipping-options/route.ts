import { NextRequest, NextResponse } from "next/server";
import { quoteShipping, type ShippingOption } from "@/lib/skydropx";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated-prisma";
import { createClient } from "@/lib/supabase/server";

// Skydropx rate IDs are scoped to the quotation that produced them. We persist
// the quote (with a 30 min TTL) and hand the client a quoteId to reference
// at checkout — that way the server can re-validate the chosen rateId without
// re-calling Skydropx (which would mint fresh, non-matching IDs).
const QUOTE_TTL_MINUTES = 30;

export async function POST(req: NextRequest) {
  try {
    // Shipping quotes hit Skydropx + write a ShippingQuote row, so gate behind
    // auth. The /checkout page that calls this is already auth-protected by
    // middleware; this prevents a bare curl from farming quotes anonymously.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const zip = String(body.zip || "").trim().slice(0, 10);
    const city = String(body.city || "").trim().slice(0, 80);
    const state = String(body.state || "").trim().slice(0, 80);
    const address = String(body.address || "").trim().slice(0, 200);
    const totalItems = Number(body.totalItems || 1);

    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: "Código postal inválido" }, { status: 400 });
    }
    if (!Number.isFinite(totalItems) || totalItems < 1 || totalItems > 50) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    const options: ShippingOption[] = await quoteShipping({
      destinationZip: zip,
      destinationCity: city,
      destinationState: state,
      destinationAddress: address,
      totalItems,
    });

    if (options.length === 0) {
      return NextResponse.json({ options: [], quoteId: null });
    }

    const expiresAt = new Date(Date.now() + QUOTE_TTL_MINUTES * 60 * 1000);
    const quote = await prisma.shippingQuote.create({
      data: {
        zipCode: zip,
        totalItems,
        rates: options as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
      select: { id: true },
    });

    return NextResponse.json({ options, quoteId: quote.id });
  } catch (error: any) {
    console.error("Shipping quote error:", error);
    return NextResponse.json(
      { error: "No pudimos cotizar el envío. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
