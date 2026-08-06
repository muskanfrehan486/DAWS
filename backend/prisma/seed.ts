import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("🚀 Running seed...");

  // Ensure Human Resources department exists
  const department = await prisma.department.upsert({
    where: {
      name: "Human Resources",
    },
    update: {},
    create: {
      name: "Human Resources",
    },
  });

  const department2 = await prisma.department.upsert({
    where: {
      name: "Finance",
    },
    update: {},
    create: {
      name: "Finance",
    },
  });

  console.log("✅ Department:", department.name);
  console.log("✅ Department:", department2.name);

  // Look for existing auth user
  const { data: usersData, error: listError } =
    await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    throw listError;
  }

  let authUser = usersData.users.find(
    (u) => u.email === "admin@example.com"
  );

  // Create auth user if it doesn't exist
  if (!authUser) {
    console.log("Creating auth user...");

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@example.com",
      password: "StrongPassword123!",
      email_confirm: true,
    });

    if (error) {
      throw error;
    }

    authUser = data.user;
    console.log("✅ Auth user created.");
  } else {
    console.log("✅ Auth user already exists.");
  }

  // Ensure application user exists
  const user = await prisma.user.upsert({
    where: {
      id: authUser.id,
    },
    update: {},
    create: {
      id: authUser.id,
      firstName: "Admin",
      lastName: "User",
      email: authUser.email!,
      departmentId: department.id,
      loginRole: "ADMINISTRATOR",
    },
  });

  console.log("✅ Application user:", user.email);

  console.log("🎉 Seed completed successfully.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:");
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });