import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Verifying production migration...\n');

  try {
    // 1. Check if Category table exists and has data
    const categoryCount = await prisma.category.count();
    console.log(`✅ Category table: ${categoryCount} categories found`);

    if (categoryCount === 0) {
      console.log('❌ No categories found! Migration may have failed.');
      return false;
    }

    // 2. Check if all furniture has categoryId assigned
    const furnitureCount = await prisma.furniture.count();
    const furnitureWithoutCategory = await prisma.furniture.count({
      where: { categoryId: null }
    });

    console.log(`📦 Total furniture: ${furnitureCount}`);
    console.log(`❌ Furniture without category: ${furnitureWithoutCategory}`);

    if (furnitureWithoutCategory > 0) {
      console.log('❌ Some furniture items are missing category assignments!');
      return false;
    }

    // 3. Show category distribution
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { furniture: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log('\n📊 Category Distribution:');
    categories.forEach(category => {
      const featuredIcon = category.featured ? '⭐' : '📁';
      const imageIcon = category.imageUrl ? '🖼️' : '❌';
      console.log(`${featuredIcon} ${imageIcon} ${category.name}: ${category._count.furniture} items`);
    });

    // 4. Check for orphaned data
    const orphanedImages = await prisma.furnitureImage.count({
      where: {
        furniture: null
      }
    });

    console.log(`\n🖼️ Furniture images: ${await prisma.furnitureImage.count()} total`);
    console.log(`❌ Orphaned images: ${orphanedImages}`);

    // 5. Check showroom table if it exists
    try {
      const showroomCount = await prisma.showroomImage.count();
      console.log(`🏠 Showroom images: ${showroomCount}`);
    } catch (error) {
      console.log('ℹ️ Showroom table not found (normal if not migrated yet)');
    }

    // 6. Summary
    console.log('\n🎉 Migration Verification Summary:');
    console.log(`✅ Categories: ${categoryCount}`);
    console.log(`✅ Furniture with categories: ${furnitureCount - furnitureWithoutCategory}/${furnitureCount}`);
    console.log(`✅ Images: ${await prisma.furnitureImage.count()}`);

    if (furnitureWithoutCategory === 0 && categoryCount > 0) {
      console.log('\n🎊 Migration verification PASSED! Your production database is ready.');
      return true;
    } else {
      console.log('\n❌ Migration verification FAILED! Please check the issues above.');
      return false;
    }

  } catch (error) {
    console.error('💥 Error during verification:', error);
    
    // Check if this is a schema mismatch (old schema)
    if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      console.log('\nℹ️ This appears to be the old schema (category as string).');
      console.log('🚀 You need to run: npx prisma migrate deploy');
    }
    
    return false;
  }
}

async function showPreMigrationInfo() {
  console.log('📊 Pre-migration analysis (category as string)...\n');
  
  try {
    // This will only work on the old schema
    const furnitureWithCategories = await prisma.$queryRaw`
      SELECT category, COUNT(*) as count 
      FROM "Furniture" 
      WHERE category IS NOT NULL 
      GROUP BY category 
      ORDER BY count DESC
    `;

    console.log('Categories found in production (as strings):');
    console.table(furnitureWithCategories);
    
    const totalFurniture = await prisma.furniture.count();
    console.log(`\nTotal furniture items: ${totalFurniture}`);
    console.log('\n🚀 Ready for migration! These categories will become Category table records.');
    
  } catch (error) {
    console.log('ℹ️ Cannot analyze old schema (migration may already be complete)');
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--pre-migration')) {
    await showPreMigrationInfo();
  } else {
    await verifyMigration();
  }
}

main()
  .catch((e) => {
    console.error('💥 Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 