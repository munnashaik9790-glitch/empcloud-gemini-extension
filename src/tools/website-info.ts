/**
 * MCP Tool: get_empcloud_website_info
 * Retrieves public information about the EmpCloud website and capabilities.
 */

import { z } from 'zod';
import { getEmpCloudWebsiteInfo } from '../wordpress/api.js';
import { EmpCloudApiError } from '../wordpress/client.js';

export const WebsiteInfoInputSchema = z.object({}).describe('No parameters required to fetch public website info.');

export async function handleGetWebsiteInfo(_rawArgs?: unknown) {
  try {
    const info = await getEmpCloudWebsiteInfo();

    const lines = [
      `# ${info.name}`,
      `**Tagline:** ${info.tagline}`,
      `**Website URL:** ${info.url}`,
      `**Home URL:** ${info.homeUrl}`,
      '',
      '### EmpCloud Workforce Management Modules:',
      '- HRMS (Human Resource Management System)',
      '- Biometrics & Facial Recognition Attendance',
      '- Payroll & Tax Management',
      '- Field Force Tracking & Management',
      '- Project Management',
      '- Rewards & Recognition',
      '- Performance & Career Management',
      '- Recruitment & Onboarding',
      '- EmpMonitor (Employee Activity & Productivity Monitoring)',
      '- Exit & Portfolio Management',
      '',
      `### API Capabilities:`,
      `WordPress REST API namespaces supported: ${info.namespaces.join(', ')}`
    ];

    return {
      content: [
        {
          type: 'text' as const,
          text: lines.join('\n')
        }
      ]
    };
  } catch (err: any) {
    const errorMessage =
      err instanceof EmpCloudApiError
        ? err.message
        : `An unexpected error occurred while retrieving EmpCloud website info: ${err?.message || 'Unknown error'}`;

    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error retrieving EmpCloud website info: ${errorMessage}`
        }
      ]
    };
  }
}
