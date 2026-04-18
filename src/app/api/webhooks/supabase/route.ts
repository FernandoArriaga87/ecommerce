import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  
  // Verificación de seguridad simple
  if (authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { record, type } = payload;

    if (type === "INSERT") {
      const { id, email, raw_user_meta_data } = record;
      const name = raw_user_meta_data?.name || "Usuario";

      await prisma.user.upsert({
        where: { id },
        update: {
          email,
          name,
        },
        create: {
          id,
          email,
          name,
          password: "SYNCED_FROM_AUTH",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Supabase Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
