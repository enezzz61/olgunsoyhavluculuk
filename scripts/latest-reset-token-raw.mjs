import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.env.DEBUG_EMAIL?.trim().toLowerCase();

if (!email) {
  console.error("DEBUG_EMAIL gerekli.");
  process.exit(1);
}

async function main() {
  const result = await prisma.$runCommandRaw({
    find: "passwordResetTokens",
    filter: { email },
    sort: { createdAt: -1 },
    limit: 1,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
