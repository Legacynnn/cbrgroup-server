import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface VoilerFurniture {
  name: string;
  size: string | null;
  inStock: boolean;
  category: string;
  images: Array<{
    url: string;
    position: number;
  }>;
}

async function main() {
  console.log('🚀 Starting Voller furniture data import...');

  // Read the voller.json file
  const voilerDataPath = path.join(process.cwd(), 'scripts', 'voller.json');
  
  if (!fs.existsSync(voilerDataPath)) {
    throw new Error(`Voller data file not found at: ${voilerDataPath}`);
  }

  const voilerData: VoilerFurniture[] = JSON.parse(fs.readFileSync(voilerDataPath, 'utf8'));
  
  console.log(`📦 Found ${voilerData.length} Voller furniture items to import`);

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const item of voilerData) {
    try {
      // Check if furniture with same name and producer already exists
      const existingFurniture = await prisma.furniture.findFirst({
        where: {
          name: item.name,
          producer: 'voller'
        }
      });

      if (existingFurniture) {
        console.log(`⏭️ Skipping "${item.name}" - already exists`);
        skippedCount++;
        continue;
      }

      // Find or create category
      let category = await prisma.category.findFirst({
        where: {
          name: {
            equals: item.category,
            mode: 'insensitive'
          }
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: item.category
          }
        });
        console.log(`📁 Created new category: "${category.name}"`);
      }

      // Create the furniture item
      const furniture = await prisma.furniture.create({
        data: {
          name: item.name,
          size: item.size ? JSON.stringify([item.size]) : null,
          inStock: item.inStock,
          categoryId: category.id,
          producer: 'voller',
          description: `High-quality ${item.category.toLowerCase()} from Voller collection.`,
          images: {
            create: item.images.map(img => ({
              url: img.url,
              position: img.position,
            }))
          }
        },
        include: {
          category: true,
          images: true
        }
      });

      console.log(`✅ Created "${furniture.name}" with ${furniture.images?.length || 0} images`);
      createdCount++;

    } catch (error) {
      console.error(`❌ Error creating "${item.name}":`, error);
      errorCount++;
    }
  }

  console.log('\n🎉 Voller furniture import completed!');
  console.log(`✅ Created: ${createdCount} items`);
  console.log(`⏭️ Skipped (already exists): ${skippedCount} items`);
  console.log(`❌ Errors: ${errorCount} items`);

  // Show summary statistics
  const voilerFurnitureCount = await prisma.furniture.count({
    where: { producer: 'voller' }
  });

  const voilerByCategory = await prisma.furniture.findMany({
    where: { producer: 'voller' },
    include: {
      category: true
    }
  });

  // Group by category manually
  const categoryGroups: { [key: string]: number } = {};
  voilerByCategory.forEach(furniture => {
    const categoryName = furniture.category.name;
    categoryGroups[categoryName] = (categoryGroups[categoryName] || 0) + 1;
  });

  console.log(`\n📊 Total Voller furniture in database: ${voilerFurnitureCount} items`);
  console.log('\n📋 Voller furniture by category:');
  Object.entries(categoryGroups).forEach(([categoryName, count]) => {
    console.log(`- ${categoryName}: ${count} items`);
  });
}

main()
  .catch((e) => {
    console.error('💥 Voller import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 