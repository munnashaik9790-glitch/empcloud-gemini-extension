/**
 * EmpCloud WordPress API Interface
 * Interacts with public WordPress REST API endpoints on empcloud.com.
 */

import {
  fetchEmpCloudJson,
  cleanHtmlText,
  isAllowedEmpCloudUrl,
  EmpCloudApiError,
  DEFAULT_TIMEOUT_MS,
  EMPCLOUD_BASE_URL
} from './client.js';

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
  title?: { rendered?: string };
  link?: string;
  excerpt?: { rendered?: string };
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
 * Fetch description for an individual page to enrich search results.
 * Fails gracefully without breaking the search response.
 */
async function fetchPageDescription(pageId: number): Promise<string> {
  try {
    const page = await fetchEmpCloudJson<RawPageItem>(
      `/wp-json/wp/v2/pages/${pageId}`,
      {
        timeoutMs: 3000,
        searchParams: { _fields: 'id,excerpt,yoast_head_json' }
      }
    );

    const yoastDesc = page.yoast_head_json?.description || page.yoast_head_json?.og_description;
    if (yoastDesc) {
      return cleanHtmlText(yoastDesc);
    }

    const excerpt = page.excerpt?.rendered;
    if (excerpt) {
      const cleaned = cleanHtmlText(excerpt);
      if (cleaned) return cleaned;
    }

    return '';
  } catch {
    // Graceful fallback: individual page metadata enrichment should never abort the search
    return '';
  }
}

/**
 * Search public EmpCloud website content via the verified WordPress REST API search endpoint.
 *
 * @param query Search query string
 * @param limit Maximum results to return (1-10, default 5)
 */
export async function searchEmpCloud(
  query: string,
  limit: number = 5
): Promise<SearchResultItem[]> {
  const sanitizedQuery = query.trim();
  if (!sanitizedQuery) {
    return [];
  }

  const clampedLimit = Math.min(Math.max(limit, 1), 10);

  const rawResults = await fetchEmpCloudJson<RawSearchItem[]>('/wp-json/wp/v2/search', {
    timeoutMs: DEFAULT_TIMEOUT_MS,
    searchParams: {
      search: sanitizedQuery,
      per_page: clampedLimit
    }
  });

  if (!Array.isArray(rawResults)) {
    throw new EmpCloudApiError('Invalid search response from EmpCloud: expected an array.');
  }

  // Filter and normalize items, validating URLs
  const validItems = rawResults.filter((item) => {
    return (
      item &&
      typeof item.id === 'number' &&
      typeof item.title === 'string' &&
      typeof item.url === 'string' &&
      isAllowedEmpCloudUrl(item.url)
    );
  }).slice(0, clampedLimit);

  // Enrich with short descriptions where available
  const enrichedResults: SearchResultItem[] = await Promise.all(
    validItems.map(async (item) => {
      const cleanTitle = cleanHtmlText(item.title) || 'EmpCloud Resource';
      let description = '';

      if (item.subtype === 'page' || item.type === 'post') {
        description = await fetchPageDescription(item.id);
      }

      if (!description) {
        description = `EmpCloud public ${item.subtype || item.type || 'resource'}: ${cleanTitle}`;
      }

      const fullUrl = item.url.startsWith('http')
        ? item.url
        : new URL(item.url, EMPCLOUD_BASE_URL).toString();

      return {
        id: item.id,
        title: cleanTitle,
        url: fullUrl,
        type: item.type || 'unknown',
        subtype: item.subtype || 'unknown',
        description
      };
    })
  );

  return enrichedResults;
}

/**
 * Retrieve public metadata from the EmpCloud WordPress site.
 */
export async function getEmpCloudWebsiteInfo(): Promise<WebsiteInfoResult> {
  const root = await fetchEmpCloudJson<RawRootInfo>('/wp-json/', {
    timeoutMs: DEFAULT_TIMEOUT_MS
  });

  const validUrl = isAllowedEmpCloudUrl(root.url || '') ? root.url! : 'https://empcloud.com';
  const validHome = isAllowedEmpCloudUrl(root.home || '') ? root.home! : 'https://empcloud.com';

  return {
    name: cleanHtmlText(root.name) || 'EMPCloud',
    tagline: cleanHtmlText(root.description) || 'The Complete Workforce Management Suite',
    url: validUrl,
    homeUrl: validHome,
    namespaces: Array.isArray(root.namespaces) ? root.namespaces : []
  };
}
