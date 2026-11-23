/**
 * EmpCloud WordPress API Interface
 * Interacts with public WordPress REST API endpoints on empcloud.com.
 */
export interface RawSearchItem {
    id: number;
    title: string;
    url: string;
    type: string;
    subtype: string;
    _links?: Record<string, any>;
}
export interface RawPageItem {
    id: number;
    title?: {
        rendered?: string;
    };
    link?: string;
    excerpt?: {
        rendered?: string;
    };
    yoast_head_json?: {
        title?: string;
        description?: string;
        og_description?: string;
    };
}
export interface RawRootInfo {
    name?: string;
    description?: string;
    url?: string;
    home?: string;
    namespaces?: string[];
}
export interface SearchResultItem {
    id: number;
    title: string;
    url: string;
    type: string;
    subtype: string;
    description: string;
}
export interface WebsiteInfoResult {
    name: string;
    tagline: string;
    url: string;
    homeUrl: string;
    namespaces: string[];
}
/**
 * Search public EmpCloud website content via the verified WordPress REST API search endpoint.
 *
 * @param query Search query string
 * @param limit Maximum results to return (1-10, default 5)
 */
export declare function searchEmpCloud(query: string, limit?: number): Promise<SearchResultItem[]>;
/**
 * Retrieve public metadata from the EmpCloud WordPress site.
 */
export declare function getEmpCloudWebsiteInfo(): Promise<WebsiteInfoResult>;
