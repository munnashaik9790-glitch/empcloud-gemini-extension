/**
 * EmpCloud HTTP Client
 * Secure, lightweight HTTP client tailored for public EmpCloud WordPress REST API.
 */
export declare const EMPCLOUD_BASE_URL = "https://empcloud.com";
export declare const DEFAULT_TIMEOUT_MS = 8000;
/**
 * Custom error class for EmpCloud API errors
 */
export declare class EmpCloudApiError extends Error {
    readonly statusCode?: number;
    readonly isTimeout: boolean;
    constructor(message: string, options?: {
        statusCode?: number;
        isTimeout?: boolean;
        cause?: unknown;
    });
}
/**
 * Validate that a URL belongs to the official EmpCloud domain.
 */
export declare function isAllowedEmpCloudUrl(urlString: string): boolean;
/**
 * Strip HTML tags and decode standard HTML entities for clean display.
 */
export declare function cleanHtmlText(raw: string | null | undefined): string;
export interface FetchOptions {
    timeoutMs?: number;
    searchParams?: Record<string, string | number | undefined>;
}
/**
 * Perform a GET request to the EmpCloud WordPress REST API.
 */
export declare function fetchEmpCloudJson<T>(pathOrUrl: string, options?: FetchOptions): Promise<T>;
