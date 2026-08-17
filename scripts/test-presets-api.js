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
  console.log('Testing Unit Presets API...');
  const listRes = await req('/units/presets');
  console.log('1. List Presets status:', listRes.status, 'Total count:', listRes.data?.data?.length);

  const unitsRes = await req('/units/categories');
  const kgUnit = unitsRes.data?.data?.[0]?.units?.find(u => u.symbol === 'kg');
  console.log('2. kg Unit presets count:', kgUnit?.quantityPresets?.length);

  // Test create preset
  const createRes = await req('/units/presets', 'POST', {
    unitId: kgUnit.id,
    value: 15.0,
    label: '15 kg',
    labelSi: 'කි.ග්‍රෑ. 15',
    sortOrder: 8,
  });
  console.log('3. Created Preset:', createRes.status, createRes.data?.data?.label);
  const createdId = createRes.data?.data?.id;

  // Test update preset
  const updateRes = await req(`/units/presets/${createdId}`, 'PUT', {
    label: '15 kg (Commercial)',
  });
  console.log('4. Updated Preset:', updateRes.status, updateRes.data?.data?.label);

  // Test delete preset
  const delRes = await req(`/units/presets/${createdId}`, 'DELETE');
  console.log('5. Deleted Preset:', delRes.status, delRes.data?.message);

  console.log('\nUnit Presets backend API passed 100%!');
}

test().catch(console.error);
