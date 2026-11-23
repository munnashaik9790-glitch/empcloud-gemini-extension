/**
 * Manual integration test using the compiled EmpCloud API & tools.
 * Connects to live empcloud.com WordPress endpoints.
 */

import { searchEmpCloud, getEmpCloudWebsiteInfo } from '../dist/wordpress/api.js';
import { handleSearchEmpCloud } from '../dist/tools/search-empcloud.js';
import { handleGetWebsiteInfo } from '../dist/tools/website-info.js';

async function main() {
  console.log('====================================================');
  console.log('Testing live EmpCloud API integration');
  console.log('====================================================\n');

  console.log('1. Testing get_empcloud_website_info...');
  const websiteInfo = await handleGetWebsiteInfo();
  console.log(websiteInfo.content[0].text);

  console.log('\n----------------------------------------------------\n');

  console.log('2. Testing search_empcloud with query "attendance" (limit 3)...');
  const searchRes = await handleSearchEmpCloud({ query: 'attendance', limit: 3 });
  console.log(searchRes.content[0].text);

  console.log('\n----------------------------------------------------\n');

  console.log('3. Testing search_empcloud with query "payroll" (limit 2)...');
  const payrollRes = await handleSearchEmpCloud({ query: 'payroll', limit: 2 });
  console.log(payrollRes.content[0].text);

  console.log('\n====================================================');
  console.log('Live EmpCloud manual integration test finished.');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Manual test failed:', err);
  process.exit(1);
});
