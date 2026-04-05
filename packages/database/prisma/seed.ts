import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "Ăn uống", icon: "restaurant", color: "#ef4444" },
  { name: "Di chuyển", icon: "car", color: "#f97316" },
  { name: "Mua sắm", icon: "cart", color: "#eab308" },
  { name: "Giải trí", icon: "game-controller", color: "#22c55e" },
  { name: "Sức khỏe", icon: "medkit", color: "#06b6d4" },
  { name: "Giáo dục", icon: "book", color: "#3b82f6" },
  { name: "Hóa đơn", icon: "document-text", color: "#8b5cf6" },
  { name: "Nhà ở", icon: "home", color: "#ec4899" },
  { name: "Lương", icon: "cash", color: "#10b981" },
  { name: "Đầu tư", icon: "trending-up", color: "#14b8a6" },
  { name: "Quà tặng", icon: "gift", color: "#f43f5e" },
  { name: "Khác", icon: "ellipsis-horizontal", color: "#6b7280" },
];

async function seedCategories() {
  console.log("Seeding default categories...");

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, isDefault: true, userId: null },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          isDefault: true,
          userId: null,
        },
      });
    }
  }

  console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories`);
}

async function seedAdmin() {
  const firebaseUid = process.env.ADMIN_FIREBASE_UID;
  const email = process.env.ADMIN_EMAIL || "admin@fingenie.vn";
  const displayName = process.env.ADMIN_DISPLAY_NAME || "FinGenie Admin";

  if (!firebaseUid) {
    console.log("Skipping admin seed: ADMIN_FIREBASE_UID not set");
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { firebaseUid },
  });

  if (existing) {
    // Ensure admin role
    if (existing.role !== "admin") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "admin" },
      });
      console.log(
        `Updated existing user ${existing.displayName} to admin role`,
      );
    } else {
      console.log(`Admin user already exists: ${existing.displayName}`);
    }
    return;
  }

  await prisma.user.create({
    data: {
      firebaseUid,
      email,
      displayName,
      role: "admin",
    },
  });

  console.log(`Created admin user: ${displayName} (${email})`);
}

async function main() {
  await seedCategories();
  await seedAdmin();
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
