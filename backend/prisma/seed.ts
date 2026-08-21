import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Roles
  const rolesData = [
    { id: 1, roleName: 'Admin' },
    { id: 2, roleName: 'Staff' },
    { id: 3, roleName: 'Student' },
  ];

  for (const role of rolesData) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { roleName: role.roleName },
      create: role,
    });
  }
  console.log('✅ Roles seeded (Admin, Staff, Student)');

  // 2. Seed Users
  const usersData = [
    {
      id: 1,
      name: 'System Admin',
      email: 'admin@university.edu',
      microsoftId: 'ms-admin-001',
      roleId: 1,
      department: 'IT Services',
    },
    {
      id: 2,
      name: 'Store Staff Member',
      email: 'staff@university.edu',
      microsoftId: 'ms-staff-001',
      roleId: 2,
      department: 'Merchandise & Bookstore',
    },
    {
      id: 3,
      name: 'Khine Khant',
      email: 'khine.k@student.university.edu',
      microsoftId: 'ms-student-6611718',
      roleId: 3,
      department: 'Computer Science',
    },
    {
      id: 4,
      name: 'Siva Paoren',
      email: 'siva.p@student.university.edu',
      microsoftId: 'ms-student-6630064',
      roleId: 3,
      department: 'Computer Science',
    },
    {
      id: 5,
      name: 'Thant Zin Oo',
      email: 'thant.z@student.university.edu',
      microsoftId: 'ms-student-6722060',
      roleId: 3,
      department: 'Business Administration',
    },
  ];

  for (const user of usersData) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        roleId: user.roleId,
        department: user.department,
        microsoftId: user.microsoftId,
      },
      create: user,
    });
  }
  console.log('✅ Sample users seeded');

  // 3. Seed Categories
  const categoriesData = [
    { id: 1, name: 'Apparel & Clothing' },
    { id: 2, name: 'Stationery & Books' },
    { id: 3, name: 'Accessories & Drinkware' },
    { id: 4, name: 'Electronics & Tech' },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name },
      create: cat,
    });
  }
  console.log('✅ Categories seeded');

  // 4. Seed Products
  const productsData = [
    {
      id: 1,
      name: 'Signature University Hoodie',
      description: 'Premium heavyweight cotton blend hoodie embroidered with the official university crest. Features kangaroo pockets, fleece lining, and reinforced stitching for supreme campus comfort.',
      price: 790.00,
      stock: 45,
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
      department: null,
      discountPct: 0.00,
      categoryId: 1,
      createdBy: 2,
    },
    {
      id: 2,
      name: 'Computer Science Department Varsity Jacket',
      description: 'Exclusive Computer Science Department premium bomber jacket with cyber-blue trim, custom embroidered CS patch, and water-resistant outer shell. Eligible for 20% discount for verified CS students.',
      price: 1290.00,
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=800&q=80',
      department: 'Computer Science',
      discountPct: 20.00,
      categoryId: 1,
      createdBy: 2,
    },
    {
      id: 3,
      name: 'Thermal Stainless Steel Water Bottle 750ml',
      description: 'Double-wall vacuum insulated flask keeping drinks cold for 24 hours or hot for 12 hours. Laser engraved university seal with spill-proof lid.',
      price: 390.00,
      stock: 80,
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
      department: null,
      discountPct: 0.00,
      categoryId: 3,
      createdBy: 2,
    },
    {
      id: 4,
      name: 'Hardcover Executive Academic Notebook',
      description: 'Eco-friendly 100gsm acid-free dotted paper with embossed gold-foil university emblem, expandable inner pocket, and ribbon bookmark.',
      price: 180.00,
      stock: 120,
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      department: null,
      discountPct: 0.00,
      categoryId: 2,
      createdBy: 2,
    },
    {
      id: 5,
      name: 'Engineering & Tech Precision Canvas Tote Bag',
      description: 'Heavy-duty 16oz organic canvas bag with padded laptop compartment, zipper closure, and department badge. CS and Engineering students eligible for 15% discount.',
      price: 320.00,
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      department: 'Computer Science',
      discountPct: 15.00,
      categoryId: 3,
      createdBy: 2,
    },
    {
      id: 6,
      name: 'Alumni & Student Classic Cap',
      description: '100% brushed cotton twill 6-panel adjustable baseball cap with 3D embroidery.',
      price: 250.00,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
      department: null,
      discountPct: 0.00,
      categoryId: 3,
      createdBy: 2,
    },
  ];

  for (const prod of productsData) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: prod,
      create: prod,
    });
  }
  console.log('✅ Products seeded');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
