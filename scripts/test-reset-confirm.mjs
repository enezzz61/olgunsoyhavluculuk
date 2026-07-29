import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.env.DEBUG_EMAIL?.trim().toLowerCase();
const newPassword = process.env.DEBUG_PASSWORD?.trim() || "Test1234!";

if (!email) {
  console.error("DEBUG_EMAIL gerekli.");
  process.exit(1);
}

async function main() {
  const response = await prisma.$runCommandRaw({
    find: "passwordResetTokens",
    filter: { email, purpose: "user" },
    sort: { createdAt: -1 },
    limit: 1,
  });

  const token = response?.documents?.[0]?.token;
  if (!token) {
    console.error("Token bulunamadi.");
    process.exit(1);
  }

  console.log("Token:", token);
  const apiResponse = await fetch("http://localhost:3000/api/auth/confirm-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await apiResponse.json().catch(() => ({}));
  console.log("STATUS:", apiResponse.status);
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
