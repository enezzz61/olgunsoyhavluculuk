import { prisma } from "../lib/prisma";

async function main() {
  const total = await prisma.product.count();
  const active = await prisma.product.count({ where: { active: true } });
  const inactive = await prisma.product.count({ where: { active: false } });
  console.log(JSON.stringify({ total, active, inactive }, null, 2));
  const products = await prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: "asc" }, take: 20 });
  console.log(JSON.stringify(products.map((product) => ({ id: product.id, sku: product.sku, name: product.name, active: product.active })), null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
