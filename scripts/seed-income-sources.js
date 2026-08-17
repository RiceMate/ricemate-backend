/**
 * Seed script: Income Sources
 * Run with: node scripts/seed-income-sources.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding income sources...\n');

  // Use the existing system user as createdBy
  const systemUser = await prisma.user.findFirstOrThrow({
    where: { email: 'system@ricemate.local' },
  });

  const sources = [
    { name: 'Homagama Junction Eatery',   description: 'First shop'  },
    { name: 'Homagama Bus stand Eatery',  description: 'Second shop' },
  ];

  for (const source of sources) {
    const existing = await prisma.incomeSource.findFirst({
      where: { name: source.name },
    });
    if (existing) {
      console.log(`  ⏭  Already exists: "${source.name}" (id: ${existing.id})`);
      continue;
    }
    const created = await prisma.incomeSource.create({
      data: { ...source, createdById: systemUser.id },
    });
    console.log(`  ✓  Created: "${created.name}" — ${created.description} (id: ${created.id})`);
  }

  console.log('\n🎉 Done! Income sources seeded successfully.');
}

main()
  .catch((e) => { console.error('\n❌ Error:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
