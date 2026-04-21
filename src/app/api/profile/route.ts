import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/profile
// Returns the authenticated user's profile. For backwards compatibility
// it still exposes the flat `address/city/state/zipCode` of the default
// address; new callers (checkout) should use the full `addresses` array.
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const defaultAddress =
      user.addresses.find((a) => a.isDefault) || user.addresses[0];

    return NextResponse.json({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: defaultAddress?.address || "",
      city: defaultAddress?.city || "",
      state: defaultAddress?.state || "",
      zipCode: defaultAddress?.zipCode || "",
      addresses: user.addresses.map((a) => ({
        id: a.id,
        label: a.label,
        name: a.name,
        phone: a.phone,
        address: a.address,
        city: a.city,
        state: a.state,
        zipCode: a.zipCode,
        isDefault: a.isDefault,
      })),
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
