/**
 * MCP Tool: search_empcloud
 * Searches public EmpCloud content using verified WordPress REST API.
 */
import { z } from 'zod';
export declare const SearchEmpCloudInputSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit?: number | undefined;
}, {
    query: string;
    limit?: number | undefined;
}>;
export type SearchEmpCloudInput = z.infer<typeof SearchEmpCloudInputSchema>;
export declare function handleSearchEmpCloud(rawArgs: unknown): Promise<{
    isError: boolean;
    content: {
        type: "text";
        text: string;
    }[];
} | {
    content: {
        type: "text";
        text: string;
    }[];
    isError?: undefined;
}>;
