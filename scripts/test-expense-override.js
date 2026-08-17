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

async function testExpenseOverride() {
  console.log('Testing Expense Duplicate Override Functionality...\n');

  // 1. Get categories
  const catRes = await req('/expenses/categories');
  const cat = catRes.data?.data?.[0];
  if (!cat) {
    console.error('No category found');
    return;
  }
  console.log('Using category:', cat.id, cat.name);

  const testDate = '2026-08-17';

  // 2. Submit initial expense entry
  const res1 = await req('/expenses', 'POST', {
    date: testDate,
    expenseId: cat.id,
    quantity: 2,
    unitPrice: 100,
    amount: 200,
    description: 'Initial Entry',
  });
  console.log('1. First submission status:', res1.status, 'ID:', res1.data?.data?.id, 'Amount:', res1.data?.data?.amount);
  const firstId = res1.data?.data?.id;

  // 3. Submit second expense entry on the same date for the same category
  const res2 = await req('/expenses', 'POST', {
    date: testDate,
    expenseId: cat.id,
    quantity: 5,
    unitPrice: 100,
    amount: 500,
    description: 'Overridden Entry',
  });
  console.log('2. Second submission status:', res2.status, 'ID:', res2.data?.data?.id, 'Amount:', res2.data?.data?.amount);
  const secondId = res2.data?.data?.id;

  if (firstId === secondId && Number(res2.data?.data?.amount) === 500) {
    console.log('\nSUCCESS! The existing record was updated in place instead of creating a duplicate row.');
  } else {
    console.error('\nFAILURE! Record IDs or amounts do not match:', { firstId, secondId });
  }

  // Cleanup test record
  await req(`/expenses/${secondId}`, 'DELETE');
  console.log('Cleaned up test record.');
}

testExpenseOverride().catch(console.error);
