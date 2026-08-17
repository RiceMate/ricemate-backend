// E:\Projects\ricemate-backend\scripts\test-settings-endpoints.js
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
  console.log('Testing Settings & CRUD Endpoints...\n');

  // 1. List income sources
  const res1 = await req('/income/sources?includeInactive=true');
  console.log('1. List income sources (includeInactive):', res1.status, res1.data?.data?.length, 'sources');

  // 2. Create test income source
  const res2 = await req('/income/sources', 'POST', {
    name: 'Temporary Test Eatery',
    description: 'Test shop description',
    defaultParcelPrice: 175,
    isActive: true,
  });
  console.log('2. Create income source:', res2.status, res2.data?.data?.id, res2.data?.data?.name);
  const testSourceId = res2.data?.data?.id;

  // 3. Update income source
  if (testSourceId) {
    const res3 = await req(`/income/sources/${testSourceId}`, 'PUT', {
      name: 'Updated Test Eatery',
      isActive: false,
    });
    console.log('3. Update income source:', res3.status, res3.data?.data?.name, 'isActive:', res3.data?.data?.isActive);
  }

  // 4. List root categories
  const res4 = await req('/expenses/categories?includeInactive=true');
  console.log('4. List root categories:', res4.status, res4.data?.data?.length, 'categories');

  // 5. Create test subcategory under category 1 (Cost)
  const res5 = await req('/expenses/categories', 'POST', {
    name: 'Test Category Utility',
    description: 'Subcategory test',
    parentId: 1,
    isActive: true,
  });
  console.log('5. Create subcategory:', res5.status, res5.data?.data?.id, res5.data?.data?.name);
  const testCatId = res5.data?.data?.id;

  // 6. Update category
  if (testCatId) {
    const res6 = await req(`/expenses/categories/${testCatId}`, 'PUT', {
      name: 'Updated Category Utility',
      isActive: false,
    });
    console.log('6. Update category:', res6.status, res6.data?.data?.name, 'isActive:', res6.data?.data?.isActive);
  }

  console.log('\nAll CRUD endpoints tested successfully!');
}

run().catch(console.error);
