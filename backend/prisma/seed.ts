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

const DEPARTMENTS = [
  "Administration",
  "Beauty & Fragrance",
  "Chairman",
  "Corporate Sales",
  "Customer Services",
  "E-Com IT",
  "E-Com Operations",
  "Fabric Sourcing & Procurment",
  "Facility Management",
  "Finance",
  "Folding / Packing",
  "Footwear & Bags",
  "Gents Fabric",
  "Health & Safety",
  "Home Textile",
  "HR Shared Services & Regulatory Compliance",
  "Human Resource",
  "Human Resources",
  "Information Technology",
  "Internal Audit",
  "Inventory",
  "Ladies Fabric",
  "Ladies Pret",
  "Laundry",
  "Marketing",
  "Paid Marketing",
  "Procurement",
  "Product Sourcing & Procurement",
  "Project Management",
  "Retail Front Operation",
  "Retail Planning & Analytics",
  "Security",
  "SEO",
  "Stitching Unit - KSU",
  "Studio",
  "Supply Chain",
  "Western Apparel",
  "Wholesales Front Operation",
] as const;

async function main() {
  console.log("🚀 Running seed...");

  for (const name of DEPARTMENTS) {
    const department = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log("✅ Department:", department.name);
  }

  const department = await prisma.department.findFirst({
    where: { name: "Human Resources" },
  });

  if (!department) {
    throw new Error("Human Resources department not found after seed");
  }

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
      password: "password",
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