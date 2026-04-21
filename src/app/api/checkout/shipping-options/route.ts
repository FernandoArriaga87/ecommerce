import { NextRequest, NextResponse } from "next/server";
import { quoteShipping } from "@/lib/skydropx";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const zip = String(body.zip || "").trim();
    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();
    const address = String(body.address || "").trim();
    const totalItems = Number(body.totalItems || 1);

    if (!/^\d{4,5}$/.test(zip)) {
      return NextResponse.json({ error: "Código postal inválido" }, { status: 400 });
    }
    if (!Number.isFinite(totalItems) || totalItems < 1 || totalItems > 50) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    const options = await quoteShipping({ 
      destinationZip: zip, 
      destinationCity: city, 
      destinationState: state, 
      destinationAddress: address, 
      totalItems 
    });
    return NextResponse.json({ options });
  } catch (error: any) {
    console.error("Shipping quote error:", error);
    return NextResponse.json(
      { error: "No pudimos cotizar el envío. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
