import { prisma } from "./prisma";

async function main() {
  // Placeholder — replace with API bootstrap once routes are implemented.
  await prisma.$connect();
  console.log("Database connection established.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
