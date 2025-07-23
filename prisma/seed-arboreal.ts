import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ArborealFurniture {
  name: string;
  description: string;
  size: string[];
  inStock: boolean;
  category: string;
  images: Array<{
    url: string;
    position: number;
  }>;
}

// Category mapping to standardize names
const categoryMapping: Record<string, string> = {
  'dinner tables': 'Dining Tables',
  'curved-tables': 'Curved Tables',
  'center-tables': 'Center Tables',
  'benches': 'Benches',
  'sideboards': 'Sideboards'
};

async function main() {
  console.log('🌳 Starting Arboreal furniture data import...');

  // Read the arboreal JSON file
  const arborealDataPath = path.join(process.cwd(),'scripts', 'arboreal.json');
  
  if (!fs.existsSync(arborealDataPath)) {
    throw new Error(`Arboreal data file not found at: ${arborealDataPath}`);
  }

  const arborealData: ArborealFurniture[] = JSON.parse(fs.readFileSync(arborealDataPath, 'utf8'));
  
  console.log(`📦 Found ${arborealData.length} Arboreal furniture items to import`);

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const item of arborealData) {
    try {
      // Standardize category name
      const standardizedCategoryName = categoryMapping[item.category] || item.category;
      
      // Check if furniture with same name and producer already exists
      const existingFurniture = await prisma.furniture.findFirst({
        where: {
          name: item.name,
          producer: 'arboreal'
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
            equals: standardizedCategoryName,
            mode: 'insensitive'
          }
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: standardizedCategoryName,
            featured: false
          }
        });
        console.log(`📁 Created new category: "${category.name}"`);
      }

      // Extract wood type from name for producer context
      const woodType = item.name.includes('Pequiá') ? 'Pequiá' : 
                      item.name.includes('Ipê') ? 'Ipê' : 'Solid Wood';

      // Create the furniture item
      const furniture = await prisma.furniture.create({
        data: {
          name: item.name,
          size: JSON.stringify(item.size), // Store size array as JSON
          description: item.description,
          inStock: item.inStock,
          categoryId: category.id,
          producer: 'arboreal',
          featured: false, // Can be updated later via admin
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

      console.log(`✅ Created "${furniture.name}" in category "${category.name}" with ${furniture.images?.length || 0} images`);
      createdCount++;

    } catch (error) {
      console.error(`❌ Error creating "${item.name}":`, error);
      errorCount++;
    }
  }

  console.log('\n🎉 Arboreal furniture import completed!');
  console.log(`✅ Created: ${createdCount} items`);
  console.log(`⏭️ Skipped (already exists): ${skippedCount} items`);
  console.log(`❌ Errors: ${errorCount} items`);

  // Show summary statistics
  const arborealFurnitureCount = await prisma.furniture.count({
    where: { producer: 'arboreal' }
  });

  const arborealByCategory = await prisma.furniture.findMany({
    where: { producer: 'arboreal' },
    include: {
      category: true
    }
  });

  // Group by category manually
  const categoryGroups: { [key: string]: number } = {};
  arborealByCategory.forEach(furniture => {
    const categoryName = furniture.category.name;
    categoryGroups[categoryName] = (categoryGroups[categoryName] || 0) + 1;
  });

  console.log(`\n📊 Total Arboreal furniture in database: ${arborealFurnitureCount} items`);
  console.log('\n📋 Arboreal furniture by category:');
  Object.entries(categoryGroups).forEach(([categoryName, count]) => {
    console.log(`- ${categoryName}: ${count} items`);
  });

  // Show category mapping used
  console.log('\n🗂️ Category mappings applied:');
  Object.entries(categoryMapping).forEach(([original, mapped]) => {
    console.log(`- "${original}" → "${mapped}"`);
  });
}

main()
  .catch((e) => {
    console.error('💥 Arboreal import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 