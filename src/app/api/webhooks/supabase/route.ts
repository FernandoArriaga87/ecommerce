import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { resend, SEND_FROM } from "@/lib/resend";
import WelcomeEmail from "@/components/emails/WelcomeEmail";
import { timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET ?? ""}`;

  if (!process.env.SUPABASE_WEBHOOK_SECRET || !safeCompare(authHeader, expected)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { record, type } = payload;

    if (type === "INSERT") {
      const { id, email, raw_user_meta_data } = record;
      const name = raw_user_meta_data?.name || "Deportista";

      // 1. Sincronizar usuario con la DB local
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
        },
      });

      // 2. Enviar correo de bienvenida vía Resend
      if (resend) {
        try {
          const { data, error: sendError } = await resend.emails.send({
            from: SEND_FROM,
            to: email,
            subject: "¡Bienvenido a AuraSport!",
            react: WelcomeEmail({ userFirstname: name.split(" ")[0] }),
          });
          
          if (sendError) {
            console.error("Error API Resend (correo de bienvenida):", sendError);
          } else {
            console.log(`Correo de bienvenida enviado con éxito a: ${email}`, data);
          }
        } catch (emailError) {
          console.error("Excepción enviando correo de bienvenida:", emailError);
          // No detenemos el proceso si el correo falla, la sincronización ya fue exitosa.
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Supabase Webhook Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
