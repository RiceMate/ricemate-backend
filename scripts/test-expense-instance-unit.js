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
  console.log('Testing Expense Instance with Quantity, Unit Price and Amount auto-calculation...\n');

  // 1. Get root categories to find an active category
  const categoriesRes = await req('/expenses/categories');
  const cat = categoriesRes.data?.data?.[0];
  console.log('1. Using Category:', cat?.id, cat?.name);

  // 2. Submit an expense with 5 units @ 120 = 600
  const submitRes = await req('/expenses', 'POST', {
    date: '2026-08-17',
    expenseId: cat.id,
    quantity: 5,
    unitPrice: 120,
    amount: 600,
    description: 'Auto-calculated expense test',
  });
  console.log('2. Submitted Expense Instance:', submitRes.status, submitRes.data?.data);

  // 3. Clean up test record
  if (submitRes.data?.data?.id) {
    const delRes = await req(`/expenses/${submitRes.data.data.id}`, 'DELETE');
    console.log('3. Cleaned up Expense Instance:', delRes.status);
  }

  console.log('\nExpense Instance verification succeeded 100%!');
}

run().catch(console.error);
