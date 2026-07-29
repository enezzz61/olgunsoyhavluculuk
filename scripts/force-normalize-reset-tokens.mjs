import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$runCommandRaw({
    update: "passwordResetTokens",
    updates: [
      {
        q: {},
        u: [
          {
            $set: {
              expiresAt: {
                $cond: [
                  { $eq: [{ $type: "$expiresAt" }, "string"] },
                  { $toDate: "$expiresAt" },
                  "$expiresAt",
                ],
              },
              createdAt: {
                $cond: [
                  { $eq: [{ $type: "$createdAt" }, "string"] },
                  { $toDate: "$createdAt" },
                  "$createdAt",
                ],
              },
            },
          },
        ],
        multi: true,
      },
    ],
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
