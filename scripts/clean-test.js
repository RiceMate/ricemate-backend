const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  await prisma.expense.deleteMany({
    where: { name: { contains: 'Test' } },
  });
  await prisma.expense.deleteMany({
    where: { name: { contains: 'Updated Category Utility' } },
  });
  await prisma.incomeSource.deleteMany({
    where: { name: { contains: 'Test' } },
  });
  console.log('Database cleaned.');
  await prisma.$disconnect();
  process.exit(0);
}

clean().catch((e) => {
  console.error(e);
  process.exit(1);
});
