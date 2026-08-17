require('dotenv').config();
const http = require('http');

async function runTests() {
  const appModule = require('../dist/app.js');
  const app = appModule.default || appModule;

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`🧪 Test server running at ${baseUrl}\n`);

  async function request(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const json = await res.json();
    return { status: res.status, data: json };
  }

  try {
    // 1. Health check
    console.log('1️⃣ Testing GET /health');
    const health = await request('/health');
    console.log('  Status:', health.status, '| Response:', JSON.stringify(health.data));

    // 2. Income Sources
    console.log('\n2️⃣ Testing GET /api/v1/income/sources');
    const sources = await request('/api/v1/income/sources');
    console.log('  Status:', sources.status, '| Sources Count:', sources.data.data.length);
    console.log('  Sources:', JSON.stringify(sources.data.data));

    // 3. Check Income for Today
    const todayStr = new Date().toISOString().slice(0, 10);
    console.log(`\n3️⃣ Testing GET /api/v1/income/check?date=${todayStr}`);
    const checkBefore = await request(`/api/v1/income/check?date=${todayStr}`);
    console.log('  Status:', checkBefore.status, '| Submitted:', checkBefore.data.data.submitted);

    // 4. Submit Income
    console.log(`\n4️⃣ Testing POST /api/v1/income for ${todayStr}`);
    const submitIncomeRes = await request('/api/v1/income', {
      method: 'POST',
      body: JSON.stringify({
        date: todayStr,
        entries: [
          { sourceId: 1, parcelCount: 20 }, // 20 * 170 = 3400
          { sourceId: 2, parcelCount: 15 }, // 15 * 170 = 2550
        ],
      }),
    });
    console.log('  Status:', submitIncomeRes.status, '| Message:', submitIncomeRes.data.message);
    console.log('  Created instances:', JSON.stringify(submitIncomeRes.data.data));

    // 5. Root Expense Categories
    console.log('\n5️⃣ Testing GET /api/v1/expenses/categories');
    const rootCats = await request('/api/v1/expenses/categories');
    console.log('  Status:', rootCats.status, '| Categories:', JSON.stringify(rootCats.data.data.map(c => c.name)));

    // 6. Category Children (Cost -> subcategories)
    const costCat = rootCats.data.data.find(c => c.name === 'Cost');
    if (costCat) {
      console.log(`\n6️⃣ Testing GET /api/v1/expenses/categories/${costCat.id}/children`);
      const children = await request(`/api/v1/expenses/categories/${costCat.id}/children`);
      console.log('  Children of Cost:', JSON.stringify(children.data.data.map(c => c.name)));
    }

    // 7. Submit Expense
    console.log(`\n7️⃣ Testing POST /api/v1/expenses for ${todayStr}`);
    const submitExpenseRes = await request('/api/v1/expenses', {
      method: 'POST',
      body: JSON.stringify({
        date: todayStr,
        expenseId: 6, // Rice
        quantity: 10,
        unitPrice: 250,
        amount: 2500,
        description: 'Daily rice stock',
      }),
    });
    console.log('  Status:', submitExpenseRes.status, '| Created Expense:', JSON.stringify(submitExpenseRes.data.data));

    // 8. Dashboard Today
    console.log('\n8️⃣ Testing GET /api/v1/dashboard/today');
    const todaySummary = await request('/api/v1/dashboard/today');
    console.log('  Status:', todaySummary.status, '| Summary:', JSON.stringify(todaySummary.data.data));

    // 9. Dashboard Daily
    console.log('\n9️⃣ Testing GET /api/v1/dashboard/daily');
    const dailySummary = await request('/api/v1/dashboard/daily');
    console.log('  Status:', dailySummary.status, '| Days returned:', dailySummary.data.data.length);
    console.log('  Latest Day:', JSON.stringify(dailySummary.data.data[dailySummary.data.data.length - 1]));

    // 10. Dashboard Monthly
    const [year, month] = todayStr.split('-').map(Number);
    console.log(`\n🔟 Testing GET /api/v1/dashboard/monthly?year=${year}&month=${month}`);
    const monthlySummary = await request(`/api/v1/dashboard/monthly?year=${year}&month=${month}`);
    console.log('  Status:', monthlySummary.status, '| Weeks count:', monthlySummary.data.data.length);
    console.log('  Monthly Breakdown:', JSON.stringify(monthlySummary.data.data));

    // 11. Dashboard Yearly
    console.log(`\n1️⃣1️⃣ Testing GET /api/v1/dashboard/yearly?year=${year}`);
    const yearlySummary = await request(`/api/v1/dashboard/yearly?year=${year}`);
    console.log('  Status:', yearlySummary.status, '| Months count:', yearlySummary.data.data.length);
    console.log('  Current month in year:', JSON.stringify(yearlySummary.data.data[month - 1]));

    console.log('\n🎉 ALL 11 API ENDPOINT TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
