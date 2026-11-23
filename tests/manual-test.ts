/**
 * Manual integration test using the live EmpCloud WordPress REST API.
 * Run directly with: npm run test:manual OR node scripts/manual-test.js
 */

import { searchEmpCloud, getEmpCloudWebsiteInfo } from '../src/wordpress/api.js';
import { handleSearchEmpCloud } from '../src/tools/search-empcloud.js';
import { handleGetWebsiteInfo } from '../src/tools/website-info.js';

async function runManualTest() {
  console.log('====================================================');
  console.log('Testing live EmpCloud API integration');
  console.log('====================================================\n');

  console.log('1. Testing get_empcloud_website_info...');
  try {
    const websiteInfo = await handleGetWebsiteInfo();
    console.log('Website Info Result:');
    console.log(websiteInfo.content[0].text);
  } catch (err) {
    console.error('Website info test failed:', err);
  }

  console.log('\n----------------------------------------------------\n');

  console.log('2. Testing search_empcloud with query "attendance" (limit 3)...');
  try {
    const searchRes = await handleSearchEmpCloud({ query: 'attendance', limit: 3 });
    console.log('Search Result:');
    console.log(searchRes.content[0].text);
  } catch (err) {
    console.error('Search test failed:', err);
  }

  console.log('\n----------------------------------------------------\n');

  console.log('3. Testing search_empcloud with query "payroll" (limit 2)...');
  try {
    const payrollRes = await handleSearchEmpCloud({ query: 'payroll', limit: 2 });
    console.log('Search Result:');
    console.log(payrollRes.content[0].text);
  } catch (err) {
    console.error('Payroll search test failed:', err);
  }

  console.log('\n====================================================');
  console.log('Live EmpCloud manual integration test finished.');
  console.log('====================================================');
}

runManualTest().catch((err) => {
  console.error('Manual test encountered an unexpected error:', err);
});
