import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/profile — returns the authenticated user's profile + default address
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const defaultAddress = user.addresses[0];

    return NextResponse.json({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: defaultAddress?.address || "",
      city: defaultAddress?.city || "",
      state: defaultAddress?.state || "",
      zipCode: defaultAddress?.zipCode || "",
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
