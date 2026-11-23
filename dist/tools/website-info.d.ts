/**
 * MCP Tool: get_empcloud_website_info
 * Retrieves public information about the EmpCloud website and capabilities.
 */
import { z } from 'zod';
export declare const WebsiteInfoInputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare function handleGetWebsiteInfo(_rawArgs?: unknown): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError?: undefined;
} | {
    isError: boolean;
    content: {
        type: "text";
        text: string;
    }[];
}>;
