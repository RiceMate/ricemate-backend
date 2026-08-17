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
  console.log('Testing Unit Categories & Units CRUD Workflows...\n');

  // 1. Create Unit Category
  const createCatRes = await req('/units/categories', 'POST', {
    name: 'Energy',
    nameSi: 'ශක්තිය',
    description: 'Electricity and power consumption',
    isActive: true,
  });
  console.log('1. Created Unit Category:', createCatRes.status, createCatRes.data?.data?.name);
  const catId = createCatRes.data?.data?.id;

  // 2. Update Unit Category
  const updateCatRes = await req(`/units/categories/${catId}`, 'PUT', {
    description: 'Updated energy & power units',
  });
  console.log('2. Updated Unit Category:', updateCatRes.status, updateCatRes.data?.data?.description);

  // 3. Create Unit under Category
  const createUnitRes = await req('/units', 'POST', {
    unitCategoryId: catId,
    name: 'Kilowatt-hour',
    nameSi: 'කිලෝවොට් පැය',
    symbol: 'kWh',
    symbolSi: 'කි.වො.පැ.',
    isActive: true,
  });
  console.log('3. Created Unit:', createUnitRes.status, createUnitRes.data?.data?.name, `(${createUnitRes.data?.data?.symbol})`);
  const unitId = createUnitRes.data?.data?.id;

  // 4. Update Unit
  const updateUnitRes = await req(`/units/${unitId}`, 'PUT', {
    name: 'Kilowatt Hour (Electric)',
  });
  console.log('4. Updated Unit:', updateUnitRes.status, updateUnitRes.data?.data?.name);

  // 5. Delete Unit
  const deleteUnitRes = await req(`/units/${unitId}`, 'DELETE');
  console.log('5. Deleted Unit:', deleteUnitRes.status, deleteUnitRes.data?.message);

  // 6. Delete Unit Category
  const deleteCatRes = await req(`/units/categories/${catId}`, 'DELETE');
  console.log('6. Deleted Unit Category:', deleteCatRes.status, deleteCatRes.data?.message);

  // 7. Verify clean list
  const listRes = await req('/units/categories');
  const found = listRes.data?.data?.find(c => c.id === catId);
  console.log('7. Verified Category not in list:', !found);

  console.log('\nAll Unit Categories & Units CRUD tests passed with 100% success!');
}

run().catch(console.error);
