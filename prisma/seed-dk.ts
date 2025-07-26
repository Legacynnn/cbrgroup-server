import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface DKFurniture {
  name: string;
  description: string;
  size: string[];
  inStock: boolean;
  category: string;
  producer: string;
  images: Array<{
    url: string;
    position: number;
  }>;
}

interface DKData {
  total_products: number;
  categories: string[];
  products: DKFurniture[];
  last_updated: string;
  producer: string;
}

const categoryMapping: Record<string, string> = {
  'puffs & chaises': 'Puffs & Chaises',
  'console tables': 'Console Table',
  'chairs': 'Chairs',
  'mirrors': 'Mirrors',
  'side tables': 'Side Tables',
  'center-tables': 'Center Tables',
  'dining-tables': 'Dining Table',
  'armchairs': 'Armchairs'
};

async function main() {
  console.log('🚀 Starting DK furniture data seeding...');
  
  try {
    await importDKData();
    await showFinalStats();
    
    console.log('\n🎉 DK seeding completed successfully!');
    
  } catch (error) {
    console.error('💥 DK seeding failed:', error);
    throw error;
  }
}

async function importDKData() {
  console.log('📦 Importing DK furniture data...');
  
  const dkDataPath = path.join(process.cwd(), 'scripts', 'dk.json');
  
  if (!fs.existsSync(dkDataPath)) {
    console.error('❌ DK data file not found at scripts/dk.json');
    throw new Error('DK data file not found');
  }

  const dkData: DKData = JSON.parse(fs.readFileSync(dkDataPath, 'utf8'));
  console.log(`Found ${dkData.total_products} DK furniture items`);

  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;

  for (const item of dkData.products) {
    try {
      const existingFurniture = await prisma.furniture.findFirst({
        where: {
          name: item.name,
          producer: 'DK'
        }
      });

      if (existingFurniture) {
        console.log(`⚠️ Furniture "${item.name}" already exists, updating...`);
        
        const mappedCategoryName = categoryMapping[item.category] || item.category;
        let category = await prisma.category.findFirst({
          where: {
            name: {
              equals: mappedCategoryName,
              mode: 'insensitive'
            }
          }
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: mappedCategoryName,
              featured: false
            }
          });
          console.log(`📁 Created category: "${category.name}"`);
        }

        await prisma.furniture.update({
          where: { id: existingFurniture.id },
          data: {
            description: item.description,
            size: item.size.length > 0 ? JSON.stringify(item.size) : null,
            inStock: item.inStock,
            categoryId: category.id,
            producer: 'DK'
          }
        });

        await prisma.furnitureImage.deleteMany({
          where: { furnitureId: existingFurniture.id }
        });

        await prisma.furnitureImage.createMany({
          data: item.images.map(img => ({
            url: img.url,
            position: img.position,
            furnitureId: existingFurniture.id
          }))
        });

        updatedCount++;
        continue;
      }

      const mappedCategoryName = categoryMapping[item.category] || item.category;
      let category = await prisma.category.findFirst({
        where: {
          name: {
            equals: mappedCategoryName,
            mode: 'insensitive'
          }
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: mappedCategoryName,
            featured: false
          }
        });
        console.log(`📁 Created category: "${category.name}"`);
      }

      await prisma.furniture.create({
        data: {
          name: item.name,
          description: item.description,
          size: item.size.length > 0 ? JSON.stringify(item.size) : null,
          inStock: item.inStock,
          categoryId: category.id,
          producer: 'DK',
          images: {
            create: item.images.map(img => ({
              url: img.url,
              position: img.position,
            }))
          }
        }
      });

      createdCount++;
      
      if (createdCount % 10 === 0) {
        console.log(`✅ Created ${createdCount} items...`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing "${item.name}":`, error);
      skippedCount++;
    }
  }

  console.log(`\n📊 DK Import Summary:`);
  console.log(`✅ Created: ${createdCount} items`);
  console.log(`🔄 Updated: ${updatedCount} items`);
  console.log(`⚠️ Skipped: ${skippedCount} items`);
}

async function showFinalStats() {
  console.log('\n📈 Final Database Statistics:');
  
  const totalFurniture = await prisma.furniture.count();
  const totalCategories = await prisma.category.count();
  const dkFurniture = await prisma.furniture.count({
    where: { producer: 'DK' }
  });

  console.log(`📦 Total furniture items: ${totalFurniture}`);
  console.log(`📁 Total categories: ${totalCategories}`);
  console.log(`🏷️ DK furniture items: ${dkFurniture}`);

  const categoryStats = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          furniture: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log('\n📊 Category breakdown:');
  categoryStats.forEach(category => {
    console.log(`  ${category.name}: ${category._count.furniture} items`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 