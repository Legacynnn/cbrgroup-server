import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

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

async function main() {
  console.log('🚀 Starting Living furniture seeding...');
  
  try {
    await importLivingData();
    await showFinalStats();
    
    console.log('\n🎉 Living furniture seeding completed successfully!');
    
  } catch (error) {
    console.error('💥 Living seeding failed:', error);
    throw error;
  }
}

async function importLivingData() {
  console.log('📦 Importing Living furniture data...');
  
  const livingDataPath = path.join(process.cwd(), 'scripts', 'living.json');
  
  if (!fs.existsSync(livingDataPath)) {
    throw new Error('Living data file not found at scripts/living.json');
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

async function showFinalStats() {
  console.log('\n📊 Living Furniture Statistics:');
  
  const livingFurniture = await prisma.furniture.findMany({
    where: {
      producer: "BellArte Living"
    },
    include: {
      category: true,
      variations: true,
      images: true,
      _count: {
        select: {
          variations: true,
          images: true
        }
      }
    }
  });

  console.log(`\n📦 Living Furniture Summary:`);
  console.log(`- Total Living items: ${livingFurniture.length}`);
  
  const categoriesCount = await prisma.furniture.groupBy({
    by: ['categoryId'],
    where: {
      producer: "BellArte Living"
    },
    _count: {
      categoryId: true
    }
  });

  const categoryNames = await Promise.all(
    categoriesCount.map(async (cat) => {
      const category = await prisma.category.findUnique({
        where: { id: cat.categoryId }
      });
      return { name: category?.name || 'Unknown', count: cat._count.categoryId };
    })
  );

  console.log(`\n📁 Living Categories:`);
  categoryNames.forEach(cat => {
    console.log(`- ${cat.name}: ${cat.count} items`);
  });

  const totalVariations = livingFurniture.reduce((sum, item) => sum + item._count.variations, 0);
  const totalImages = livingFurniture.reduce((sum, item) => sum + item._count.images, 0);
  const itemsWithVariations = livingFurniture.filter(item => item._count.variations > 0).length;

  console.log(`\n🎨 Variations Summary:`);
  console.log(`- Total variations: ${totalVariations}`);
  console.log(`- Items with variations: ${itemsWithVariations}`);
  console.log(`- Items without variations: ${livingFurniture.length - itemsWithVariations}`);
  console.log(`- Total images: ${totalImages}`);
  console.log(`- Average images per item: ${(totalImages / livingFurniture.length).toFixed(1)}`);
}

main()
  .catch((e) => {
    console.error('💥 Living seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 