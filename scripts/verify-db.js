require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient();

async function verify() {
  try {
    const result = await p.$queryRawUnsafe('SELECT 1 AS result');
    console.log('✅ Database connection OK:', JSON.stringify(result));

    // Also verify all 9 tables exist by counting rows
    const tables = [
      'user', 'income_source', 'expense',
      'income_instance', 'expense_template', 'expense_instance',
      'unit_category', 'unit', 'audit_log'
    ];
    for (const t of tables) {
      const count = await p.$queryRawUnsafe(`SELECT COUNT(*) as c FROM "${t}"`);
      console.log(`  ✓ Table "${t}" exists (rows: ${count[0].c})`);
    }
  } catch (e) {
    console.error('❌ FAILED:', e.message);
  } finally {
    await p.$disconnect();
  }
}

verify();
