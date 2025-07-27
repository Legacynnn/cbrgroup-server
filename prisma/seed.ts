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

interface LivingVariation {
  name: string;
  textureType: string;
  color?: string;
  colorCode?: string;
  textureImageUrl?: string | null;
  associatedImageIds?: any | null;
  inStock: boolean;
}

interface LivingFurniture {
  name: string;
  description: string;
  inStock: boolean;
  category: string;
  producer: string;
  images: Array<{
    url: string;
    position: number;
  }>;
  variations: LivingVariation[];
}

// Category mapping for standardization
const categoryMapping: Record<string, string> = {
  'dinner tables': 'Dining Tables',
  'Dinning Tables': 'Dining Tables', // Fix typo - both map to same category
  'curved-tables': 'Curved Tables',
  'center-tables': 'Center Tables',
  'benches': 'Benches',
  'sideboards': 'Sideboards'
};

async function main() {
  console.log('🚀 Starting PRODUCTION database seeding...');
  console.log('This will create categories and import all furniture data.\n');

  try {
    // Step 1: Import Voller furniture data
    await importVollerData();
    
    // Step 2: Import Bell-Arte (beds) data if exists
    await importBellArteData();

    // Step 3: Import Arboreal furniture data
    await importArborealData();
    
    // Step 4: Import Living (BellArte Living) furniture data
    await importLivingData();
    
    // Step 5: Update producers based on categories
    await updateProducers();
    
    // Step 6: Show final statistics
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

async function importArborealData() {
  console.log('\n📦 Step 3: Importing Arboreal furniture data...');
  
  const arborealDataPath = path.join(process.cwd(), '..', 'cbr-crawler', 'output', 'arboreal-final-ultimate-database.json');
  
  if (!fs.existsSync(arborealDataPath)) {
    console.log('⚠️ Arboreal data file not found, skipping...');
    return;
  }

  const arborealData: ArborealFurniture[] = JSON.parse(fs.readFileSync(arborealDataPath, 'utf8'));
  console.log(`Found ${arborealData.length} Arboreal furniture items`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const item of arborealData) {
    try {
      // Standardize category name using mapping
      const standardizedCategoryName = categoryMapping[item.category] || item.category;
      
      const existingFurniture = await prisma.furniture.findFirst({
        where: {
          name: item.name,
          producer: 'arboreal'
        }
      });

      if (existingFurniture) {
        skippedCount++;
        continue;
      }

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
        console.log(`📁 Created category: "${category.name}"`);
      }

      await prisma.furniture.create({
        data: {
          name: item.name,
          size: JSON.stringify(item.size), // Store size array as JSON
          description: item.description,
          inStock: item.inStock,
          categoryId: category.id,
          producer: 'arboreal',
          featured: false,
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

  console.log(`✅ Arboreal import: ${createdCount} created, ${skippedCount} skipped`);
}

async function importLivingData() {
  console.log('\n📦 Step 4: Importing Living furniture data...');
  
  const livingDataPath = path.join(process.cwd(), 'scripts', 'living.json');
  
  if (!fs.existsSync(livingDataPath)) {
    console.log('⚠️ Living data file not found, skipping...');
    return;
  }

  const livingData: LivingFurniture[] = JSON.parse(fs.readFileSync(livingDataPath, 'utf8'));
  console.log(`Found ${livingData.length} Living furniture items`);

  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;

  for (const item of livingData) {
    try {
      const existingFurniture = await prisma.furniture.findFirst({
        where: {
          name: item.name,
          producer: item.producer
        },
        include: {
          variations: true,
          images: true
        }
      });

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

      if (existingFurniture) {
        console.log(`🔄 Updating existing furniture: "${item.name}"`);
        
        await prisma.furniture.update({
          where: { id: existingFurniture.id },
          data: {
            description: item.description,
            inStock: item.inStock,
            categoryId: category.id,
            producer: item.producer,
            images: {
              deleteMany: {},
              create: item.images.map(img => ({
                url: img.url,
                position: img.position,
              }))
            },
            variations: {
              deleteMany: {},
              create: item.variations.map(variation => ({
                name: variation.name,
                textureType: variation.textureType,
                color: variation.color || null,
                colorCode: variation.colorCode || null,
                textureImageUrl: variation.textureImageUrl || null,
                associatedImageIds: variation.associatedImageIds ? JSON.stringify(variation.associatedImageIds) : null,
                inStock: variation.inStock
              }))
            }
          }
        });
        
        updatedCount++;
      } else {
        console.log(`✨ Creating new furniture: "${item.name}"`);
        
        await prisma.furniture.create({
          data: {
            name: item.name,
            description: item.description,
            inStock: item.inStock,
            categoryId: category.id,
            producer: item.producer,
            featured: false,
            images: {
              create: item.images.map(img => ({
                url: img.url,
                position: img.position,
              }))
            },
            variations: {
              create: item.variations.map(variation => ({
                name: variation.name,
                textureType: variation.textureType,
                color: variation.color || null,
                colorCode: variation.colorCode || null,
                textureImageUrl: variation.textureImageUrl || null,
                associatedImageIds: variation.associatedImageIds ? JSON.stringify(variation.associatedImageIds) : null,
                inStock: variation.inStock
              }))
            }
          }
        });
        
        createdCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing "${item.name}":`, error);
      skippedCount++;
    }
  }

  console.log(`✅ Living import: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`);
}

async function updateProducers() {
  console.log('\n🔄 Step 5: Updating producers for existing furniture...');
  
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

  // Show category mapping applied for Arboreal
  console.log(`\n🗂️ Category mappings applied:`);
  Object.entries(categoryMapping).forEach(([original, mapped]) => {
    console.log(`- "${original}" → "${mapped}"`);
  });
}

main()
  .catch((e) => {
    console.error('💥 Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });