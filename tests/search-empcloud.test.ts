import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleSearchEmpCloud } from '../src/tools/search-empcloud.js';
import { handleGetWebsiteInfo } from '../src/tools/website-info.js';
import { searchEmpCloud, getEmpCloudWebsiteInfo } from '../src/wordpress/api.js';
import {
  cleanHtmlText,
  isAllowedEmpCloudUrl,
  fetchEmpCloudJson,
  EmpCloudApiError
} from '../src/wordpress/client.js';

describe('EmpCloud URL Validation & Security', () => {
  it('allows official empcloud.com domains', () => {
    expect(isAllowedEmpCloudUrl('https://empcloud.com/faq/')).toBe(true);
    expect(isAllowedEmpCloudUrl('https://www.empcloud.com/features/')).toBe(true);
    expect(isAllowedEmpCloudUrl('/wp-json/wp/v2/search')).toBe(true);
  });

  it('rejects third-party or malicious URLs', () => {
    expect(isAllowedEmpCloudUrl('https://malicious-site.com')).toBe(false);
    expect(isAllowedEmpCloudUrl('https://empcloud.com.attacker.com')).toBe(false);
    expect(isAllowedEmpCloudUrl('//attacker.com')).toBe(false);
    expect(isAllowedEmpCloudUrl('/\\attacker.com')).toBe(false);
    expect(isAllowedEmpCloudUrl('\\\\attacker.com')).toBe(false);
    expect(isAllowedEmpCloudUrl('https://empcloud.com:8080/faq/')).toBe(false);
    expect(isAllowedEmpCloudUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedEmpCloudUrl('ftp://empcloud.com')).toBe(false);
    expect(isAllowedEmpCloudUrl('')).toBe(false);
  });
});

describe('HTML Text Sanitization', () => {
  it('strips HTML tags and decodes common HTML entities', () => {
    const raw = '<p>Frequently Asked &amp; Answered &#8217;Questions&#8216; &quot;EMPCloud&quot; &apos;HRMS&apos; &#8230; &hellip; &ndash; &mdash;</p>';
    const cleaned = cleanHtmlText(raw);
    expect(cleaned).toBe("Frequently Asked & Answered 'Questions' \"EMPCloud\" 'HRMS' ... ... – —");
  });

  it('handles null, undefined, or empty strings gracefully', () => {
    expect(cleanHtmlText(null)).toBe('');
    expect(cleanHtmlText(undefined)).toBe('');
    expect(cleanHtmlText('')).toBe('');
  });
});

describe('search_empcloud Tool (Automated Mock Tests)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('1. Successful search returns structured titles, URLs, and descriptions', async () => {
    const mockSearchResults = [
      {
        id: 25923,
        title: 'FAQ &#8211; EmpCloud',
        url: 'https://empcloud.com/faq/',
        type: 'post',
        subtype: 'page'
      },
      {
        id: 25910,
        title: 'Features &amp; Modules',
        url: 'https://empcloud.com/features/',
        type: 'post',
        subtype: 'page'
      }
    ];

    const mockPageFaq = {
      id: 25923,
      yoast_head_json: {
        description: 'Get answers to all your questions about EmpCloud attendance and features.'
      }
    };

    const mockPageFeatures = {
      id: 25910,
      yoast_head_json: {
        og_description: 'Discover the full suite of workforce tools in EmpCloud.'
      }
    };

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      const urlStr = url.toString();
      if (urlStr.includes('/wp-json/wp/v2/search')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockSearchResults
        } as unknown as Response;
      }
      if (urlStr.includes('/wp-json/wp/v2/pages/25923')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockPageFaq
        } as unknown as Response;
      }
      if (urlStr.includes('/wp-json/wp/v2/pages/25910')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockPageFeatures
        } as unknown as Response;
      }
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' })
      } as unknown as Response;
    });

    const result = await handleSearchEmpCloud({ query: 'attendance', limit: 2 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Found 2 EmpCloud public resources matching "attendance"');
    expect(result.content[0].text).toContain('[FAQ – EmpCloud](https://empcloud.com/faq/)');
    expect(result.content[0].text).toContain('Get answers to all your questions about EmpCloud attendance and features.');
    expect(result.content[0].text).toContain('[Features & Modules](https://empcloud.com/features/)');
  });

  it('2. Handles no matching results gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => []
    } as unknown as Response);

    const result = await handleSearchEmpCloud({ query: 'xyznonexistentterm' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('No EmpCloud public pages or resources were found matching "xyznonexistentterm"');
  });

  it('3. Rejects invalid input (empty query, limit out of bounds)', async () => {
    // Empty query
    const res1 = await handleSearchEmpCloud({ query: '' });
    expect(res1.isError).toBe(true);
    expect(res1.content[0].text).toContain('Invalid input for search_empcloud');

    // Negative limit
    const res2 = await handleSearchEmpCloud({ query: 'attendance', limit: -1 });
    expect(res2.isError).toBe(true);
    expect(res2.content[0].text).toContain('Limit must be at least 1');

    // Limit greater than 10
    const res3 = await handleSearchEmpCloud({ query: 'attendance', limit: 15 });
    expect(res3.isError).toBe(true);
    expect(res3.content[0].text).toContain('Limit cannot exceed 10');
  });

  it('4. Handles website unavailable / network timeout', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND empcloud.com'));

    const result = await handleSearchEmpCloud({ query: 'attendance' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error searching EmpCloud: Failed to connect to EmpCloud website');
  });

  it('5. Handles HTTP server error (e.g. 500 Internal Server Error)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers({ 'content-type': 'application/json' })
    } as unknown as Response);

    const result = await handleSearchEmpCloud({ query: 'attendance' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('HTTP status 500 (Internal Server Error)');
  });

  it('6. Enforces maximum result limit and clamps correctly', async () => {
    const tenItems = Array.from({ length: 15 }, (_, i) => ({
      id: 20000 + i,
      title: `Result ${i + 1}`,
      url: `https://empcloud.com/page-${i + 1}/`,
      type: 'post',
      subtype: 'page'
    }));

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => tenItems
    } as unknown as Response);

    const results = await searchEmpCloud('management', 10);
    expect(results.length).toBe(10);
  });

  it('7. Filters out untrusted domains from search results', async () => {
    const mixedResults = [
      {
        id: 1,
        title: 'Safe Page',
        url: 'https://empcloud.com/safe/',
        type: 'post',
        subtype: 'page'
      },
      {
        id: 2,
        title: 'Phishing Page',
        url: 'https://evil-phishing-site.com/fake',
        type: 'post',
        subtype: 'page'
      },
      {
        id: 3,
        title: 'Relative URL Page',
        url: '/relative-page/',
        type: 'post',
        subtype: 'page'
      }
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mixedResults
    } as unknown as Response);

    const results = await searchEmpCloud('test', 5);
    expect(results.length).toBe(2);
    expect(results[0].url).toBe('https://empcloud.com/safe/');
    expect(results[1].url).toBe('https://empcloud.com/relative-page/');
  });
});

describe('get_empcloud_website_info Tool (Mock Tests)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('retrieves site information successfully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        name: 'EMPCloud | The Complete Workforce Management Suite',
        description: 'The Complete Workforce Management Suite',
        url: 'https://empcloud.com',
        home: 'https://empcloud.com',
        namespaces: ['wp/v2', 'yoast/v1']
      })
    } as unknown as Response);

    const res = await handleGetWebsiteInfo();
    expect(res.isError).toBeUndefined();
    expect(res.content[0].text).toContain('EMPCloud | The Complete Workforce Management Suite');
    expect(res.content[0].text).toContain('**Tagline:** The Complete Workforce Management Suite');
    expect(res.content[0].text).toContain('HRMS (Human Resource Management System)');
    expect(res.content[0].text).toContain('wp/v2, yoast/v1');
  });
});
