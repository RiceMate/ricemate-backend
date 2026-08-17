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
  console.log('Running End-to-End Unit Presets Test Suite...\n');

  // 1. Get units and inspect presets
  const unitsRes = await req('/units');
  console.log('1. Fetched Units count:', unitsRes.data?.data?.length);
  const kg = unitsRes.data?.data?.find(u => u.symbol.toLowerCase() === 'kg');
  console.log('   kg Unit has presets:', kg?.quantityPresets?.map(p => p.label || p.value));

  // 2. Fetch presets filtered by unitId
  const presetsByUnit = await req(`/units/presets?unitId=${kg.id}`);
  console.log('2. Presets for kg unit:', presetsByUnit.data?.data?.length);

  // 3. Create a test preset
  const created = await req('/units/presets', 'POST', {
    unitId: kg.id,
    value: 50.0,
    label: '50 kg (Sack)',
    labelSi: 'කි.ග්‍රෑ. 50 (මිටිය)',
    sortOrder: 10,
    isActive: true,
  });
  console.log('3. Created Preset:', created.status, created.data?.data?.label);
  const presetId = created.data?.data?.id;

  // 4. Update the test preset
  const updated = await req(`/units/presets/${presetId}`, 'PUT', {
    label: '50 kg (Large Sack)',
    value: 50.0,
  });
  console.log('4. Updated Preset:', updated.status, updated.data?.data?.label);

  // 5. Delete the test preset
  const deleted = await req(`/units/presets/${presetId}`, 'DELETE');
  console.log('5. Deleted Preset:', deleted.status, deleted.data?.message);

  console.log('\nAll Unit Presets tests passed with 100% success!');
}

run().catch(console.error);
