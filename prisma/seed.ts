import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting producer update...');
  
  const allFurniture = await prisma.furniture.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      producer: true
    }
  });
  
  console.log(`📦 Found ${allFurniture.length} furniture items to potentially update`);
  
  let updateCount = 0;
  let skipCount = 0;
  
  for (const furniture of allFurniture) {
    if (furniture.producer) {
      skipCount++;
      continue;
    }
    
    const producer = furniture.category.toLowerCase() === 'beds' || furniture.category.toLowerCase() === 'bed' 
      ? 'bell-arte' 
      : 'voller';
    
    try {
      await prisma.furniture.update({
        where: { id: furniture.id },
        data: { producer }
      });
      
      updateCount++;
      console.log(`✅ Updated "${furniture.name}" with producer: ${producer}`);
      
    } catch (error) {
      console.error(`❌ Error updating "${furniture.name}":`, error);
    }
  }
  
  console.log('\n🎉 Producer update completed!');
  console.log(`✅ Updated: ${updateCount} items`);
  console.log(`⏭️ Skipped (already had producer): ${skipCount} items`);
  
  const producerSummary = await prisma.furniture.groupBy({
    by: ['producer'],
    _count: {
      producer: true
    }
  });
  
  console.log('\n📊 Producer distribution:');
  producerSummary.forEach(item => {
    console.log(`- ${item.producer || 'No producer'}: ${item._count.producer} items`);
  });
}

main()
  .catch((e) => {
    console.error('💥 Update failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });