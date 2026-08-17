/**
 * Seed script: Expense Categories
 * Structure: 2 top-level → multiple children → grandchildren
 *
 * Run with: node scripts/seed-expense-categories.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding expense categories...\n');

  // ─────────────────────────────────────────────────────────────
  // Ensure a system user exists (required by createdBy FK)
  // ─────────────────────────────────────────────────────────────
  let systemUser = await prisma.user.findFirst({
    where: { email: 'system@ricemate.local' },
  });

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        name: 'System',
        email: 'system@ricemate.local',
        password: 'not-used',
        isActive: true,
      },
    });
    console.log(`✅ Created system user (id: ${systemUser.id})\n`);
  } else {
    console.log(`ℹ️  Using existing system user (id: ${systemUser.id})\n`);
  }

  const BY = { createdById: systemUser.id };

  // ─────────────────────────────────────────────────────────────
  // Helper: upsert a category (skip if name+parentId already exists)
  // ─────────────────────────────────────────────────────────────
  async function upsertCategory(name, parentId = null) {
    const existing = await prisma.expense.findFirst({
      where: { name, parentId },
    });
    if (existing) {
      console.log(`  ⏭  Already exists: "${name}" (id: ${existing.id})`);
      return existing;
    }
    const created = await prisma.expense.create({
      data: { name, parentId, ...BY },
    });
    console.log(`  ✓  Created: "${name}" (id: ${created.id})`);
    return created;
  }

  // ─────────────────────────────────────────────────────────────
  // Level 0 — Top-level categories
  // ─────────────────────────────────────────────────────────────
  console.log('📂 Top-level categories:');
  const cost             = await upsertCategory('Cost');
  const foodNeedCoverage = await upsertCategory('Food Need Coverage');

  // ─────────────────────────────────────────────────────────────
  // Level 1 — Children of Cost
  // ─────────────────────────────────────────────────────────────
  console.log('\n📂 Cost → sub-categories:');
  const ingredients = await upsertCategory('Ingredients', cost.id);
  const resources   = await upsertCategory('Resources',   cost.id);
  const transport   = await upsertCategory('Transport',   cost.id);

  // ─────────────────────────────────────────────────────────────
  // Level 2 — Children of Ingredients
  // ─────────────────────────────────────────────────────────────
  console.log('\n📂 Ingredients → items:');
  await upsertCategory('Rice',    ingredients.id);
  await upsertCategory('Coconut', ingredients.id);
  await upsertCategory('Dhull',   ingredients.id);

  // ─────────────────────────────────────────────────────────────
  // Level 2 — Children of Resources
  // ─────────────────────────────────────────────────────────────
  console.log('\n📂 Resources → items:');
  await upsertCategory('Electricity', resources.id);
  await upsertCategory('Gas',         resources.id);

  // ─────────────────────────────────────────────────────────────
  // Level 1 — Children of Food Need Coverage
  // ─────────────────────────────────────────────────────────────
  console.log('\n📂 Food Need Coverage → sub-categories:');
  await upsertCategory('Daily Coverage', foodNeedCoverage.id);
  await upsertCategory('Extra Items',    foodNeedCoverage.id);

  console.log('\n🎉 Done! All expense categories seeded successfully.');
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
