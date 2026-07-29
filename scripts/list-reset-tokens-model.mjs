import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.env.DEBUG_EMAIL?.trim().toLowerCase();

async function main() {
  const where = email ? { email } : {};
  const records = await prisma.passwordResetToken.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log(JSON.stringify(records, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
