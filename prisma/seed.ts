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

interface BellArteFurniture {
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
  console.log('🚀 Starting PRODUCTION database seeding...');
  console.log('This will create categories and import all furniture data.\n');

  try {
    // Step 1: Import Voller furniture data
    await importVollerData();
    
    // Step 2: Import Bell-Arte (beds) data if exists
    await importBellArteData();
    
    // Step 3: Update producers based on categories
    await updateProducers();
    
    // Step 4: Show final statistics
    await showFinalStats();
    
    console.log('\n🎉 PRODUCTION seeding completed successfully!');
    
  } catch (error) {
    console.error('💥 Production seeding failed:', error);
    throw error;
  }
}

async function importVollerData() {
  console.log('📦 Step 1: Importing Voller furniture data...');
  
  const voilerDataPath = path.join(process.cwd(), 'scripts', 'voller.json');
  
  if (!fs.existsSync(voilerDataPath)) {
    console.log('⚠️ Voller data file not found, skipping...');
    return;
  }

  const voilerData: VoilerFurniture[] = JSON.parse(fs.readFileSync(voilerDataPath, 'utf8'));
  console.log(`Found ${voilerData.length} Voller furniture items`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const item of voilerData) {
    try {
      const existingFurniture = await prisma.furniture.findFirst({
        where: {
          name: item.name,
          producer: 'voller'
        }
      });

      if (existingFurniture) {
        skippedCount++;
        continue;
      }

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
            name: item.category,
            featured: false
          }
        });
        console.log(`📁 Created category: "${category.name}"`);
      }

      await prisma.furniture.create({
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
        }
      });

      createdCount++;
    } catch (error) {
      console.error(`❌ Error creating "${item.name}":`, error);
    }
  }

  console.log(`✅ Voller import: ${createdCount} created, ${skippedCount} skipped`);
}

async function importBellArteData() {
  console.log('\n📦 Step 2: Importing Bell-Arte (beds) data...');
  
  const bellArteDataPath = path.join(process.cwd(), 'scripts', 'bellarte-beds.json');
  
  if (!fs.existsSync(bellArteDataPath)) {
    console.log('⚠️ Bell-Arte data file not found, skipping...');
    return;
  }

  const bellArteData: BellArteFurniture[] = JSON.parse(fs.readFileSync(bellArteDataPath, 'utf8'));
  console.log(`Found ${bellArteData.length} Bell-Arte furniture items`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const item of bellArteData) {
    try {
      const existingFurniture = await prisma.furniture.findFirst({
        where: {
          name: item.name,
          producer: 'bell-arte'
        }
      });

      if (existingFurniture) {
        skippedCount++;
        continue;
      }

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
            name: item.category,
            featured: false
          }
        });
        console.log(`📁 Created category: "${category.name}"`);
      }

      await prisma.furniture.create({
        data: {
          name: item.name,
          size: item.size ? JSON.stringify([item.size]) : null,
          inStock: item.inStock,
          categoryId: category.id,
          producer: 'bell-arte',
          description: `Premium ${item.category.toLowerCase()} from Bell-Arte collection.`,
          images: {
            create: item.images.map(img => ({
              url: img.url,
              position: img.position,
            }))
          }
        }
      });

      createdCount++;
    } catch (error) {
      console.error(`❌ Error creating "${item.name}":`, error);
    }
  }

  console.log(`✅ Bell-Arte import: ${createdCount} created, ${skippedCount} skipped`);
}

async function updateProducers() {
  console.log('\n🔄 Step 3: Updating producers for existing furniture...');
  
  const furnitureWithoutProducer = await prisma.furniture.findMany({
    where: {
      producer: null
    },
    include: {
      category: true
    }
  });

  let updateCount = 0;

  for (const furniture of furnitureWithoutProducer) {
    if (!furniture.category) continue;
    
    const producer = furniture.category.name.toLowerCase().includes('bed') 
      ? 'bell-arte' 
      : 'voller';

    await prisma.furniture.update({
      where: { id: furniture.id },
      data: { producer }
    });

    updateCount++;
  }

  console.log(`✅ Updated ${updateCount} furniture items with producers`);
}

async function showFinalStats() {
  console.log('\n📊 Final Statistics:');
  
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { furniture: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`\n📁 Categories (${categories.length} total):`);
  categories.forEach(category => {
    const featuredIcon = category.featured ? '⭐' : '📁';
    const imageIcon = category.imageUrl ? '🖼️' : '❌';
    console.log(`${featuredIcon} ${imageIcon} ${category.name}: ${category._count.furniture} items`);
  });

  const producerStats = await prisma.furniture.groupBy({
    by: ['producer'],
    _count: {
      producer: true
    }
  });

  console.log(`\n🏭 Producer Distribution:`);
  producerStats.forEach(stat => {
    console.log(`- ${stat.producer || 'No producer'}: ${stat._count.producer} items`);
  });

  const totalFurniture = await prisma.furniture.count();
  const inStockCount = await prisma.furniture.count({ where: { inStock: true } });
  
  console.log(`\n📦 Furniture Summary:`);
  console.log(`- Total: ${totalFurniture} items`);
  console.log(`- In Stock: ${inStockCount} items`);
  console.log(`- Out of Stock: ${totalFurniture - inStockCount} items`);
}

main()
  .catch((e) => {
    console.error('💥 Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });