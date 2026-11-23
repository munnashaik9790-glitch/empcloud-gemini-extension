/**
 * EmpCloud HTTP Client
 * Secure, lightweight HTTP client tailored for public EmpCloud WordPress REST API.
 */

export const EMPCLOUD_BASE_URL = 'https://empcloud.com';
export const DEFAULT_TIMEOUT_MS = 8000;
const ALLOWED_HOSTS = new Set(['empcloud.com', 'www.empcloud.com']);

/**
 * Custom error class for EmpCloud API errors
 */
export class EmpCloudApiError extends Error {
  public readonly statusCode?: number;
  public readonly isTimeout: boolean;

  constructor(message: string, options?: { statusCode?: number; isTimeout?: boolean; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = 'EmpCloudApiError';
    this.statusCode = options?.statusCode;
    this.isTimeout = options?.isTimeout ?? false;
  }
}

/**
 * Validate that a URL belongs to the official EmpCloud domain.
 */
export function isAllowedEmpCloudUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string' || !urlString.trim()) {
    return false;
  }
  try {
    const trimmed = urlString.trim();
    // Reject protocol-relative URLs or backslash tricks
    if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
      return false;
    }
    const parsed = new URL(trimmed, EMPCLOUD_BASE_URL);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    if (parsed.port && parsed.port !== '443' && parsed.port !== '80') {
      return false;
    }
    return ALLOWED_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Strip HTML tags and decode standard HTML entities for clean display.
 */
export function cleanHtmlText(raw: string | null | undefined): string {
  if (!raw) return '';

  return raw
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&ndash;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&mdash;/g, '—')
    .replace(/&#8230;/g, '...')
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ')
    // Normalize consecutive spaces and trim
    .replace(/\s+/g, ' ')
    .trim();
}

export interface FetchOptions {
  timeoutMs?: number;
  searchParams?: Record<string, string | number | undefined>;
}

/**
 * Perform a GET request to the EmpCloud WordPress REST API.
 */
export async function fetchEmpCloudJson<T>(
  pathOrUrl: string,
  options: FetchOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let url: URL;
  try {
    const trimmed = (pathOrUrl || '').trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
      throw new EmpCloudApiError(`Blocked invalid or protocol-relative URL: ${pathOrUrl}`);
    }
    url = trimmed.startsWith('http')
      ? new URL(trimmed)
      : new URL(trimmed, EMPCLOUD_BASE_URL);

    if (!isAllowedEmpCloudUrl(url.toString())) {
      throw new EmpCloudApiError(`Blocked request to untrusted domain: ${url.hostname}`);
    }
  } catch (err: any) {
    if (err instanceof EmpCloudApiError) {
      throw err;
    }
    throw new EmpCloudApiError(`Invalid URL provided: ${pathOrUrl} (${err?.message || 'parse error'})`);
  }

  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EmpCloud-Gemini-Extension/1.0.0 (+https://empcloud.com)'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new EmpCloudApiError(
        `EmpCloud website responded with HTTP status ${response.status} (${response.statusText})`,
        { statusCode: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const bodyPreview = await response.text().catch(() => '');
      throw new EmpCloudApiError(
        `EmpCloud website returned unexpected content-type "${contentType}" instead of JSON (preview: ${bodyPreview.slice(0, 100)})`
      );
    }

    const data = (await response.json()) as T;
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError' || controller.signal.aborted) {
      throw new EmpCloudApiError(
        `Request to EmpCloud timed out after ${timeoutMs}ms. The website may be responding slowly.`,
        { isTimeout: true, cause: error }
      );
    }

    if (error instanceof EmpCloudApiError) {
      throw error;
    }

    throw new EmpCloudApiError(
      `Failed to connect to EmpCloud website: ${error.message || 'Unknown network error'}`,
      { cause: error }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
