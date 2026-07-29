import { PrismaClient, UserRole } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const seedProducts = [
  {
    sku: "HV-100",
    name: "Premium Banyo Havlusu 90x150",
    category: "Banyo",
    image:
      "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1607962837359-5e7e89f86776?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    ],
    retailPrice: 399,
    stockStatus: "stokta",
    wholesaleEnabled: true,
    description:
      "Yuksek emicilik, yumusak dokulu ve otel segmentinde kullanima uygun.",
    wholesaleTiers: [
      { minQty: 20, unitPrice: 309 },
      { minQty: 60, unitPrice: 289 },
      { minQty: 120, unitPrice: 271 },
    ],
  },
  {
    sku: "HV-101",
    name: "El Havlusu 50x90",
    category: "El Havlusu",
    image:
      "https://images.unsplash.com/photo-1616627457694-6fdf0e19631b?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1616627457694-6fdf0e19631b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1594968973184-9040a5a79963?auto=format&fit=crop&w=1200&q=80",
    ],
    retailPrice: 169,
    stockStatus: "az_stokta",
    wholesaleEnabled: true,
    description:
      "Gunluk kullanim icin hizli kuruyan, uzun omurlu pamuk yapisi.",
    wholesaleTiers: [
      { minQty: 30, unitPrice: 129 },
      { minQty: 80, unitPrice: 115 },
    ],
  },
  {
    sku: "HV-102",
    name: "Spa Havlu Seti 4 Parca",
    category: "Set",
    image:
      "https://images.unsplash.com/photo-1631023412902-6797f51e4d54?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1631023412902-6797f51e4d54?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1604709177225-055f99402ea3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=1200&q=80",
    ],
    retailPrice: 899,
    stockStatus: "stokta",
    wholesaleEnabled: true,
    description:
      "Spa ve wellness merkezleri icin secilmis dengeli gramaj seti.",
    wholesaleTiers: [
      { minQty: 10, unitPrice: 729 },
      { minQty: 40, unitPrice: 675 },
    ],
  },
  {
    sku: "HV-103",
    name: "Plaj Havlusu 100x170",
    category: "Plaj",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1583824157194-1f5f4d6d947c?auto=format&fit=crop&w=1200&q=80",
    ],
    retailPrice: 549,
    stockStatus: "tukendi",
    wholesaleEnabled: false,
    description:
      "Genis olculu, renk korumali ve hizli kuruyan yaz koleksiyonu urunu.",
    wholesaleTiers: [],
  },
  {
    sku: "HV-104",
    name: "Mutfak Havlusu 3'lu Paket",
    category: "Mutfak",
    image:
      "https://images.unsplash.com/photo-1628641622068-4d4bb4c7b427?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1628641622068-4d4bb4c7b427?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1583845112239-97ef1341b271?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517701550927-30cf4ba1f9d0?auto=format&fit=crop&w=1200&q=80",
    ],
    retailPrice: 239,
    stockStatus: "stokta",
    wholesaleEnabled: true,
    description: "Leke tutmayan dokuma ve guclu su emme performansi.",
    wholesaleTiers: [
      { minQty: 24, unitPrice: 189 },
      { minQty: 60, unitPrice: 170 },
    ],
  },
  {
    sku: "HV-105",
    name: "Bebek Havlusu Kapusonlu",
    category: "Bebek",
    image:
      "https://images.unsplash.com/photo-1619675577659-b6ad2f68f645?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1619675577659-b6ad2f68f645?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595425964071-6f5db2f50d9b?auto=format&fit=crop&w=1200&q=80",
    ],
    retailPrice: 329,
    stockStatus: "az_stokta",
    wholesaleEnabled: false,
    description:
      "Hassas ciltlerle uyumlu, ekstra yumusak kapusonlu form.",
    wholesaleTiers: [],
  },
];

async function main() {
  const adminPassword = hashSync("123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@olgunsoyhavluculuk.com" },
    update: {},
    create: {
      name: "Olgunsoy Admin",
      email: "admin@olgunsoyhavluculuk.com",
      password: adminPassword,
      role: UserRole.toptanci,
      isAdmin: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "perakende@olgunsoyhavluculuk.com" },
    update: {},
    create: {
      name: "Demo Perakende",
      email: "perakende@olgunsoyhavluculuk.com",
      password: adminPassword,
      role: UserRole.perakende,
      isAdmin: false,
    },
  });

  await prisma.user.upsert({
    where: { email: "toptanci@olgunsoyhavluculuk.com" },
    update: {},
    create: {
      name: "Demo Toptanci",
      email: "toptanci@olgunsoyhavluculuk.com",
      password: adminPassword,
      role: UserRole.toptanci,
      isAdmin: false,
    },
  });

  for (const product of seedProducts) {
    const saved = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        sku: product.sku,
        name: product.name,
        category: product.category,
        image: product.image,
        gallery: JSON.stringify(product.gallery),
        retailPrice: product.retailPrice,
        stockStatus: product.stockStatus,
        wholesaleEnabled: product.wholesaleEnabled,
        description: product.description,
      },
      create: {
        sku: product.sku,
        name: product.name,
        category: product.category,
        image: product.image,
        gallery: JSON.stringify(product.gallery),
        retailPrice: product.retailPrice,
        stockStatus: product.stockStatus,
        wholesaleEnabled: product.wholesaleEnabled,
        description: product.description,
      },
    });

    await prisma.wholesaleTier.deleteMany({ where: { productId: saved.id } });

    if (product.wholesaleEnabled && product.wholesaleTiers.length) {
      await prisma.wholesaleTier.createMany({
        data: product.wholesaleTiers.map((tier) => ({
          productId: saved.id,
          minQty: tier.minQty,
          unitPrice: tier.unitPrice,
        })),
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
