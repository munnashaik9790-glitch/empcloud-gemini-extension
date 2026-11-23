/**
 * MCP Tool: search_empcloud
 * Searches public EmpCloud content using verified WordPress REST API.
 */
import { z } from 'zod';
import { searchEmpCloud } from '../wordpress/api.js';
import { EmpCloudApiError } from '../wordpress/client.js';
export const SearchEmpCloudInputSchema = z.object({
    query: z
        .string({
        required_error: 'Query parameter is required',
        invalid_type_error: 'Query must be a string'
    })
        .trim()
        .min(1, 'Search query cannot be empty')
        .max(200, 'Search query cannot exceed 200 characters')
        .describe('Search phrase or keywords to find EmpCloud products, features, documentation, or resources (e.g. "attendance", "payroll", "HRMS", "biometrics")'),
    limit: z
        .number({
        invalid_type_error: 'Limit must be a number'
    })
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(10, 'Limit cannot exceed 10')
        .default(5)
        .optional()
        .describe('Maximum number of search results to return (1 to 10, default 5)')
});
export async function handleSearchEmpCloud(rawArgs) {
    const parsed = SearchEmpCloudInputSchema.safeParse(rawArgs);
    if (!parsed.success) {
        const errorDetails = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Invalid input for search_empcloud: ${errorDetails}`
                }
            ]
        };
    }
    const { query, limit = 5 } = parsed.data;
    try {
        const results = await searchEmpCloud(query, limit);
        if (results.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `No EmpCloud public pages or resources were found matching "${query}". Try searching for broader terms such as "attendance", "payroll", "HRMS", "biometrics", or "features".`
                    }
                ]
            };
        }
        const lines = [
            `Found ${results.length} EmpCloud public resource${results.length === 1 ? '' : 's'} matching "${query}":\n`
        ];
        results.forEach((item, index) => {
            lines.push(`${index + 1}. **[${item.title}](${item.url})**`);
            lines.push(`   - URL: ${item.url}`);
            lines.push(`   - Type: ${item.subtype || item.type}`);
            if (item.description) {
                lines.push(`   - Summary: ${item.description}`);
            }
            lines.push('');
        });
        return {
            content: [
                {
                    type: 'text',
                    text: lines.join('\n').trim()
                }
            ]
        };
    }
    catch (err) {
        const errorMessage = err instanceof EmpCloudApiError
            ? err.message
            : `An unexpected error occurred while searching EmpCloud: ${err?.message || 'Unknown error'}`;
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Error searching EmpCloud: ${errorMessage}`
                }
            ]
        };
    }
}
