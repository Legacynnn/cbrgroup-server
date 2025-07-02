import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting categories seed...');

  try {
    // Get all existing categories that were already migrated
    const existingCategories = await prisma.category.findMany();
    
    console.log(`Found ${existingCategories.length} existing categories:`);
    existingCategories.forEach(category => {
      console.log(`- ${category.name} (${category.id})`);
    });

    // Check furniture count
    const furnitureCount = await prisma.furniture.count();
    console.log(`✅ All ${furnitureCount} furniture items have categories assigned (categoryId is required)`);
    

    // Show stats by category
    const categoryStats = await Promise.all(
      existingCategories.map(async (category) => {
        const count = await prisma.furniture.count({
          where: { categoryId: category.id }
        });
        return {
          name: category.name,
          count,
          hasImage: !!category.imageUrl
        };
      })
    );

    console.log('\n📊 Category Statistics:');
    categoryStats.forEach(stat => {
      const imageStatus = stat.hasImage ? '🖼️' : '❌';
      console.log(`${imageStatus} ${stat.name}: ${stat.count} items`);
    });

    console.log('\n✅ Categories seed completed successfully!');
    console.log(`💡 You can now add images to categories using the API endpoint: PATCH /categories/:id/image`);

  } catch (error) {
    console.error('❌ Error during categories seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 