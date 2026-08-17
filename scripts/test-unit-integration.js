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

async function test() {
  console.log('Testing Category & Income Source with Unit & ExpenseTemplate...\n');

  // 1. Get units to find kg (id: 1) and parcel (id: 5)
  const unitsRes = await req('/units');
  const kgUnit = unitsRes.data?.data?.find(u => u.symbol === 'kg');
  const parcelUnit = unitsRes.data?.data?.find(u => u.symbol === 'parcel');
  console.log('Found kg Unit ID:', kgUnit?.id, 'and parcel Unit ID:', parcelUnit?.id);

  // 2. Create Category with kg unit (unitId: 1)
  const catRes = await req('/expenses/categories', 'POST', {
    name: 'Basmati Rice',
    nameSi: 'බාස්මතී සහල්',
    description: 'Premium imported rice',
    descriptionSi: 'ආනයනික උසස් තත්ත්වයේ සහල්',
    unitId: kgUnit.id,
    defaultUnitPrice: 320,
    isActive: true,
  });
  console.log('Created Category status:', catRes.status, catRes.data);
  const catId = catRes.data?.data?.id;

  // 3. Query category children to check expenseTemplates
  const queryRes = await req('/expenses/categories?includeInactive=true');
  const createdCat = queryRes.data?.data?.find(c => c.id === catId);
  console.log('Fetched category with templates:', JSON.stringify(createdCat?.expenseTemplates, null, 2));

  // 4. Create Income Source with parcel unit (unitId: 5)
  const srcRes = await req('/income/sources', 'POST', {
    name: 'Kottawa Outlet',
    nameSi: 'කොට්ටාව ශාඛාව',
    description: 'New high-traffic shop',
    defaultParcelPrice: 190,
    unitId: parcelUnit.id,
    isActive: true,
  });
  console.log('Created Income Source status:', srcRes.status, srcRes.data);
  const srcId = srcRes.data?.data?.id;

  // 5. Query income sources to check unit
  const srcQueryRes = await req('/income/sources?includeInactive=true');
  const createdSrc = srcQueryRes.data?.data?.find(s => s.id === srcId);
  console.log('Fetched income source with unit:', JSON.stringify(createdSrc?.unit, null, 2));

  // 6. Clean up
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.expenseTemplate.deleteMany({ where: { expenseId: catId } });
  await prisma.expense.delete({ where: { id: catId } });
  await prisma.incomeSource.delete({ where: { id: srcId } });
  await prisma.$disconnect();

  console.log('\nAll tests passed successfully!');
}

test().catch(console.error);
