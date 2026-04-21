import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function requireAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, name: true, email: true },
  });
  if (!dbUser || dbUser.role !== "ADMIN") return null;
  return dbUser;
}

export async function logAudit({
  actorId,
  action,
  entityType,
  entityIds,
  metadata,
}: {
  actorId: string;
  action: string;
  entityType: "PRODUCT" | "ORDER" | "REVIEW" | "USER";
  entityIds: string[];
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityIds,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });
  } catch (err) {
    console.error("[audit-log] failed to persist entry", err);
  }
}
