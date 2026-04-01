const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.upsert({
      where: { firebaseUid: "p8YwHlPZr1OwwuDIQNwgu42xd8G3" },
      update: { role: "admin" },
      create: {
        firebaseUid: "p8YwHlPZr1OwwuDIQNwgu42xd8G3",
        email: "phuocha275@gmail.com",
        displayName: "FinGenie Admin",
        role: "admin",
      },
    });
    console.log("Admin user created:", JSON.stringify(user, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
