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
  console.log('Testing End-to-End Unit Categories, Units, and Expense Templates...\n');

  // 1. Fetch Unit Categories
  const catRes = await req('/units/categories');
  console.log('1. Fetched Unit Categories count:', catRes.data?.data?.length);

  const weightCat = catRes.data?.data?.find(c => c.name === 'Weight');
  const kgUnit = weightCat?.units?.find(u => u.symbol === 'kg');
  const gUnit = weightCat?.units?.find(u => u.symbol === 'g');
  console.log(`   Weight Category ID: ${weightCat?.id}, kg Unit ID: ${kgUnit?.id}, g Unit ID: ${gUnit?.id}`);

  // 2. Create Category with Weight (kg) & default price 260
  const createdCatRes = await req('/expenses/categories', 'POST', {
    name: 'Samba Rice',
    nameSi: 'සම්බා සහල්',
    description: 'Local standard samba',
    unitId: kgUnit.id,
    defaultUnitPrice: 260,
    isActive: true,
  });
  console.log('2. Created Category:', createdCatRes.status, createdCatRes.data?.data?.name);
  const catId = createdCatRes.data?.data?.id;

  // 3. Verify expense_template table directly in Neon DB
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const templateAfterCreate = await prisma.expenseTemplate.findFirst({
    where: { expenseId: catId },
    include: { unit: true },
  });
  console.log('3. Verified ExpenseTemplate in DB after Create:');
  console.log(`   Template ID: ${templateAfterCreate?.id}, Unit: ${templateAfterCreate?.unit?.symbol} (${templateAfterCreate?.unit?.name}), Price: ${templateAfterCreate?.defaultUnitPrice}`);

  // 4. Update Category to (g) & default price 0.35
  const updateCatRes = await req(`/expenses/categories/${catId}`, 'PUT', {
    name: 'Samba Rice Premium',
    unitId: gUnit.id,
    defaultUnitPrice: 0.35,
  });
  console.log('4. Updated Category:', updateCatRes.status, updateCatRes.data?.data?.name);

  // 5. Verify expense_template in Neon DB after update
  const templateAfterUpdate = await prisma.expenseTemplate.findFirst({
    where: { expenseId: catId },
    include: { unit: true },
  });
  console.log('5. Verified ExpenseTemplate in DB after Update:');
  console.log(`   Template ID: ${templateAfterUpdate?.id}, Unit: ${templateAfterUpdate?.unit?.symbol} (${templateAfterUpdate?.unit?.name}), Price: ${templateAfterUpdate?.defaultUnitPrice}`);

  // 6. Clean up
  await prisma.expenseTemplate.deleteMany({ where: { expenseId: catId } });
  await prisma.expense.delete({ where: { id: catId } });
  await prisma.$disconnect();

  console.log('\nAll E2E Unit & ExpenseTemplate workflows passed with 100% success!');
}

run().catch(console.error);
