const { PrismaClient } = require("@prisma/client");

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log("DB_CONNECT_OK");
  } catch (err) {
    console.error("DB_CONNECT_FAIL");
    console.error(err?.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
