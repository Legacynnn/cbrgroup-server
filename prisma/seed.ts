import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface DatabaseFurniture {
  name: string;
  size: string | null;
  inStock: boolean;
  category: string;
  images: {
    url: string;
    position: number;
  }[];
}

async function main() {
  console.log('🚀 Starting furniture data seeding...');
  
  const jsonPath = path.join(__dirname, '../scripts/voller.json');
  const furnitureData: DatabaseFurniture[] = JSON.parse(
    fs.readFileSync(jsonPath, 'utf-8')
  );
  
  console.log(`📦 Found ${furnitureData.length} products to seed`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [index, furnitureItem] of furnitureData.entries()) {
    try {
      await prisma.$transaction(async (tx) => {
        const furniture = await tx.furniture.create({
          data: {
            name: furnitureItem.name,
            size: furnitureItem.size || '', // Handle null size
            inStock: furnitureItem.inStock,
            category: furnitureItem.category,
          },
        });

        if (furnitureItem.images.length > 0) {
          await tx.furnitureImage.createMany({
            data: furnitureItem.images.map(image => ({
              url: image.url,
              position: image.position,
              furnitureId: furniture.id,
            })),
          });
        }
      });
      
      successCount++;
      if ((index + 1) % 10 === 0) {
        console.log(`✅ Processed ${index + 1}/${furnitureData.length} products`);
      }
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Error processing product "${furnitureItem.name}":`, error);
    }
  }
  
  console.log('\n🎉 Seeding completed!');
  console.log(`✅ Successfully inserted: ${successCount} products`);
  console.log(`❌ Errors: ${errorCount} products`);
  
  const totalFurniture = await prisma.furniture.count();
  const totalImages = await prisma.furnitureImage.count();
  
  console.log(`\n📊 Database totals:`);
  console.log(`- Furniture items: ${totalFurniture}`);
  console.log(`- Images: ${totalImages}`);
}

main()
  .catch((e) => {
    console.error('💥 Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });