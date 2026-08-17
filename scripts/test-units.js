const http = require('http');

function req(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: `/api/v1${path}`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer system-token',
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
    r.end();
  });
}

async function test() {
  console.log('Testing Units Endpoints...\n');

  const res1 = await req('/units/categories');
  console.log('Unit Categories Response:', res1.status);
  console.log(JSON.stringify(res1.data, null, 2));

  const res2 = await req('/units');
  console.log('\nAll Units Response:', res2.status, res2.data?.data?.length, 'units returned');
}

test().catch(console.error);
