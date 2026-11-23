#!/usr/bin/env node

/**
 * EmpCloud MCP Server Entry Point
 * Exposes EmpCloud public search and resource tools via Model Context Protocol.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { handleSearchEmpCloud } from './tools/search-empcloud.js';
import { handleGetWebsiteInfo } from './tools/website-info.js';

const server = new McpServer({
  name: 'empcloud',
  version: '1.0.0'
});

// Tool: search_empcloud
server.tool(
  'search_empcloud',
  'Search publicly available EmpCloud products, features, documentation, and website resources by keywords (e.g. attendance, payroll, HRMS, monitoring).',
  {
    query: z
      .string()
      .min(1, 'Search query cannot be empty')
      .max(200, 'Search query cannot exceed 200 characters')
      .describe('Search phrase or keywords to find EmpCloud products, features, or resources (e.g. "attendance", "payroll", "HRMS", "biometrics")'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(10)
      .default(5)
      .optional()
      .describe('Maximum number of search results to return (1-10, default 5)')
  },
  async (args) => {
    return handleSearchEmpCloud(args);
  }
);

// Tool: get_empcloud_website_info
server.tool(
  'get_empcloud_website_info',
  'Retrieve general public information about EmpCloud, its primary workforce management modules, and official website URLs.',
  {},
  async () => {
    return handleGetWebsiteInfo();
  }
);

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('EmpCloud MCP Server started on stdio transport');
}

run().catch((err) => {
  console.error('Fatal error starting EmpCloud MCP Server:', err);
  process.exit(1);
});
