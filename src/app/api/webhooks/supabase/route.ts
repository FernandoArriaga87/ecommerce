import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { resend, SEND_FROM } from "@/lib/resend";
import WelcomeEmail from "@/components/emails/WelcomeEmail";

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
            subject: "¡Bienvenido a DeportivoStore!",
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
