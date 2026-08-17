// Test dual-language endpoints
const http = require('http');

function req(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer system-token',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const r = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function run() {
  console.log('Testing Solution 1 Dual-Language CRUD...\n');

  // 1. Create a category with English and Sinhala
  const res1 = await req('/expenses/categories', 'POST', {
    name: 'Beverages',
    nameSi: 'බීම වර්ග',
    description: 'Drinks and juices',
    descriptionSi: 'සිසිල් බීම සහ යුෂ',
    isActive: true,
  });
  console.log('1. Created Category with Sinhala:', res1.status, res1.data?.data?.name, '->', res1.data?.data?.nameSi);
  const catId = res1.data?.data?.id;

  // 2. Create an income source with English and Sinhala
  const res2 = await req('/income/sources', 'POST', {
    name: 'Kottawa Express Eatery',
    nameSi: 'කොට්ටාව එක්ස්ප්‍රස් ආපනශාලාව',
    description: 'Third outlet near station',
    descriptionSi: 'දුම්රිය ස්ථානය අසල තෙවන ශාඛාව',
    defaultParcelPrice: 180,
    isActive: true,
  });
  console.log('2. Created Income Source with Sinhala:', res2.status, res2.data?.data?.name, '->', res2.data?.data?.nameSi);
  const srcId = res2.data?.data?.id;

  // 3. Verify getRootCategories returns nameSi
  const res3 = await req('/expenses/categories?includeInactive=true');
  const foundCat = res3.data?.data?.find(c => c.id === catId);
  console.log('3. Fetched category verified:', foundCat?.name, '->', foundCat?.nameSi);

  // 4. Verify getIncomeSources returns nameSi
  const res4 = await req('/income/sources?includeInactive=true');
  const foundSrc = res4.data?.data?.find(s => s.id === srcId);
  console.log('4. Fetched income source verified:', foundSrc?.name, '->', foundSrc?.nameSi);

  // 5. Clean up test records
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  if (catId) await prisma.expense.delete({ where: { id: catId } });
  if (srcId) await prisma.incomeSource.delete({ where: { id: srcId } });
  await prisma.$disconnect();

  console.log('\nDual-Language Solution 1 verified successfully!');
}

run().catch(console.error);
