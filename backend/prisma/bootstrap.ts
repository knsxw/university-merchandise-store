import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const requiredRoles = ['Admin', 'Staff', 'Student'];

async function main() {
  console.log('🔐 Bootstrapping required RBAC roles...');

  for (const roleName of requiredRoles) {
    await prisma.role.upsert({
      where: { roleName },
      update: {},
      create: { roleName },
    });
  }

  console.log('✅ Required roles are ready (Admin, Staff, Student)');
}

main()
  .catch((error) => {
    console.error('❌ Production bootstrap failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
