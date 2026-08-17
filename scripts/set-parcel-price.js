require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.incomeSource.updateMany({ data: { defaultParcelPrice: 170 } })
  .then((r) => console.log(`✅ Updated ${r.count} income sources → LKR 170/parcel`))
  .catch((e) => console.error('❌', e.message))
  .finally(() => p.$disconnect());
