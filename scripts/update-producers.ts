import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateProducers() {
  console.log('🚀 Starting producer update for existing furniture...');
  
  try {
    // Get all furniture items that don't have a producer set
    const furnitureItems = await prisma.furniture.findMany({
      where: {
        OR: [
          { producer: null },
          { producer: '' }
        ]
      },
      include: {
        category: true
      }
    });

    console.log(`📦 Found ${furnitureItems.length} furniture items without producer`);

    if (furnitureItems.length === 0) {
      console.log('✨ All furniture items already have producers assigned!');
      return;
    }

    let bedsCount = 0;
    let otherCount = 0;

    // Update producers based on category
    for (const furniture of furnitureItems) {
      const producer = furniture.category.name.toLowerCase() === 'beds' || furniture.category.name.toLowerCase() === 'bed' 
        ? 'bell-arte' 
        : 'voller';

      await prisma.furniture.update({
        where: { id: furniture.id },
        data: { producer }
      });

      if (producer === 'bell-arte') {
        bedsCount++;
      } else {
        otherCount++;
      }

      console.log(`✅ Updated "${furniture.name}" (${furniture.category.name}) -> ${producer}`);
    }

    console.log('\n🎉 Producer update completed!');
    console.log(`🛏️  Bell-Arte products (Beds): ${bedsCount}`);
    console.log(`🪑 Voller products (Other): ${otherCount}`);

    // Show summary of current producers
    const producerSummary = await prisma.furniture.groupBy({
      by: ['producer'],
      _count: {
        producer: true
      }
    });

    console.log('\n📊 Current producer distribution:');
    producerSummary.forEach(item => {
      console.log(`- ${item.producer || 'No producer'}: ${item._count.producer} items`);
    });

  } catch (error) {
    console.error('💥 Error updating producers:', error);
    throw error;
  }
}

async function main() {
  await updateProducers();
}

main()
  .catch((e) => {
    console.error('💥 Producer update failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 