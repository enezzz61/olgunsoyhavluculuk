import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.env.ADMIN_EMAIL;

if (!email) {
  console.error("ADMIN_EMAIL gerekli.");
  process.exit(1);
}

async function main() {
  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
  });

  console.log(`Admin yapildi: ${user.email}`);
  console.log(`isAdmin: ${user.isAdmin}`);
  console.log(`role: ${user.role}`);
}

main()
  .catch((error) => {
    console.error("Admin atama hatasi:", error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
