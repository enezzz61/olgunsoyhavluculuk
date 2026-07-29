import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL bulunamadı. Önce canlı ortamda .env veya sunucu ortam değişkenini ayarlayın.");
  process.exit(1);
}

const prisma = new PrismaClient();
const email = process.env.ADMIN_EMAIL || "admin@olgunsoyhavluculuk.com";
const password = process.env.ADMIN_PASSWORD || "123456";
const name = process.env.ADMIN_NAME || "Olgunsoy Admin";
const role = process.env.ADMIN_ROLE === "perakende" ? "perakende" : "toptanci";

async function main() {
  const passwordHash = hashSync(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: passwordHash,
      role,
      isAdmin: true,
    },
    create: {
      name,
      email,
      password: passwordHash,
      role,
      isAdmin: true,
    },
  });

  console.log(`Admin hesabı hazır: ${user.email}`);
  console.log(`Şifre: ${password}`);
  console.log(`Admin giriş sayfasından giriş yapabilirsiniz.`);
}

main()
  .catch((error) => {
    console.error("Admin hesabı oluşturulamadı:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
