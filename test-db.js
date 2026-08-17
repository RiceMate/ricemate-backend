require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to DB at:', process.env.DATABASE_URL?.split('@')[1]);
  const start = Date.now();
  const user = await prisma.user.findFirst();
  console.log(`Connected in ${Date.now() - start}ms! User:`, user?.name, user?.email);
}

main()
  .catch((e) => console.error('Connection failed:', e))
  .finally(() => prisma.$disconnect());
