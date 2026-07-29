import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tokens = await prisma.$runCommandRaw({
    find: "passwordResetTokens",
    filter: {},
    limit: 1000,
  });

  const documents = tokens?.cursor?.firstBatch || [];
  let converted = 0;

  for (const document of documents) {
    const updates = {};

    if (typeof document.expiresAt === "string") {
      updates.expiresAt = new Date(document.expiresAt);
    }

    if (typeof document.createdAt === "string") {
      updates.createdAt = new Date(document.createdAt);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.$runCommandRaw({
        update: "passwordResetTokens",
        updates: [
          {
            q: { _id: document._id },
            u: { $set: updates },
          },
        ],
      });
      converted += 1;
    }
  }

  console.log(`Normalized ${converted} password reset token document(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
