const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const columns = await prisma.$queryRaw`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name IN ('unit', 'unit_category', 'expense', 'income_source')
    ORDER BY table_name, ordinal_position;
  `;
  console.log('Columns in Neon Database:');
  console.table(columns);

  const units = await prisma.unit.findMany();
  console.log('\nSample Unit records:');
  console.log(JSON.stringify(units, null, 2));

  const unitCats = await prisma.unitCategory.findMany();
  console.log('\nSample UnitCategory records:');
  console.log(JSON.stringify(unitCats, null, 2));

  await prisma.$disconnect();
}

check().catch(console.error);
