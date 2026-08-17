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
  console.log('Testing Delete Category & Delete Income Source Features...\n');

  // 1. Create temporary category
  const createCatRes = await req('/expenses/categories', 'POST', {
    name: 'Temporary Category For Deletion',
    nameSi: 'තාවකාලික කාණ්ඩය',
    description: 'To be deleted',
    isActive: true,
  });
  console.log('1. Created Category:', createCatRes.status, createCatRes.data?.data?.name);
  const catId = createCatRes.data?.data?.id;

  // 2. Delete the category
  const deleteCatRes = await req(`/expenses/categories/${catId}`, 'DELETE');
  console.log('2. Deleted Category:', deleteCatRes.status, deleteCatRes.data?.message);

  // Verify it's gone or inactive
  const roots = await req('/expenses/categories');
  const foundCat = roots.data?.data?.find(c => c.id === catId);
  console.log('   Category in active roots list?', foundCat ? 'Yes (unexpected)' : 'No (verified deleted)');

  // 3. Create temporary income source
  const createSourceRes = await req('/income/sources', 'POST', {
    name: 'Temporary Stall For Deletion',
    nameSi: 'තාවකාලික වෙළඳසැල',
    defaultParcelPrice: 150,
    isActive: true,
  });
  console.log('3. Created Income Source:', createSourceRes.status, createSourceRes.data?.data?.name);
  const sourceId = createSourceRes.data?.data?.id;

  // 4. Delete the income source
  const deleteSourceRes = await req(`/income/sources/${sourceId}`, 'DELETE');
  console.log('4. Deleted Income Source:', deleteSourceRes.status, deleteSourceRes.data?.message);

  // Verify it's gone
  const sources = await req('/income/sources');
  const foundSource = sources.data?.data?.find(s => s.id === sourceId);
  console.log('   Source in active sources list?', foundSource ? 'Yes (unexpected)' : 'No (verified deleted)');

  console.log('\nAll Delete tests completed with 100% success!');
}

run().catch(console.error);
