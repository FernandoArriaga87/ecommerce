const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Quitar el rol de ADMIN a admin@deportivostore.com
  const oldAdmin = await prisma.user.updateMany({
    where: { email: 'admin@deportivostore.com' },
    data: { role: 'CUSTOMER' }
  });
  console.log(`Rol actualizado a CUSTOMER para admin@deportivostore.com: ${oldAdmin.count} usuario(s) modificado(s).`);

  // 2. Asignar el rol de ADMIN a cbm0100687arriaga@gmail.com
  const newAdmin = await prisma.user.updateMany({
    where: { email: 'cbm0100687arriaga@gmail.com' },
    data: { role: 'ADMIN' }
  });
  console.log(`Rol actualizado a ADMIN para cbm0100687arriaga@gmail.com: ${newAdmin.count} usuario(s) modificado(s).`);

  // Mostrar los usuarios actualizados
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['admin@deportivostore.com', 'cbm0100687arriaga@gmail.com']
      }
    },
    select: { email: true, role: true }
  });
  console.log("\nUsuarios actualizados:");
  console.log(users);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
