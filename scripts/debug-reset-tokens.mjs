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
    limit: 10,
  });

  const docs = result?.documents || [];
  if (!docs.length) {
    console.log("Token kaydi bulunamadi.");
    return;
  }

  const now = Date.now();
  for (const doc of docs) {
    const expiresMs = new Date(doc.expiresAt).getTime();
    const createdMs = new Date(doc.createdAt).getTime();
    const isExpired = Number.isFinite(expiresMs) ? expiresMs < now : true;
    console.log({
      token: String(doc.token || "").slice(0, 12) + "...",
      used: doc.used,
      purpose: doc.purpose,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
      isExpired,
      ageMinutes: Number.isFinite(createdMs) ? Math.round((now - createdMs) / 60000) : null,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
