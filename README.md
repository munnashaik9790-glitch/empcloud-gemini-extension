# EmpCloud Product and Resource Search - Gemini CLI Extension

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-1.6.0-green.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready **Gemini CLI extension** and **Model Context Protocol (MCP)** server that enables developers, AI assistants, and users to search and discover public workforce management products, features, documentation, and web resources from [EmpCloud](https://empcloud.com/).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [MCP Tools](#mcp-tools)
4. [Requirements](#requirements)
5. [Installation & Linking](#installation--linking)
6. [Development Setup & Build](#development-setup--build)
7. [Automated & Manual Testing](#automated--manual-testing)
8. [Example Prompts](#example-prompts)
9. [Architecture & Content Source](#architecture--content-source)
10. [Security & Reliability](#security--reliability)
11. [Troubleshooting](#troubleshooting)
12. [GitHub Publishing Instructions](#github-publishing-instructions)
13. [License](#license)

---

## Project Overview

When using the Gemini CLI, users frequently need up-to-date links and summaries about EmpCloud modules—such as biometric attendance, HRMS, payroll management, field force tracking, or employee monitoring (EmpMonitor).

This extension connects the Gemini CLI with the verified public WordPress REST API on `empcloud.com`. It queries live public content, enriches search results with verified Yoast SEO metadata and excerpts, and returns clean, clickable links directly to the user without touching private accounts or internal systems.

---

## Features

- **Public Website Search:** Live querying of EmpCloud's public WordPress REST API (`/wp-json/wp/v2/search`).
- **Rich Snippets & Summaries:** Enriches search results with public Yoast SEO descriptions and excerpts where available.
- **Website Info Tool:** Provides high-level platform information, module listings, and supported API capabilities.
- **Strict Domain Filtering:** Validates all returned links against an allowlist (`empcloud.com`, `www.empcloud.com`) to guard against malicious redirections.
- **HTML Sanitization:** Strips HTML formatting tags and decodes common entities (`&amp;`, `&#8217;`, `&quot;`) into clean plain text.
- **Timeout & Error Resilience:** Configurable request timeouts (default: 8s), graceful fallbacks, and user-friendly error messages.
- **Full Gemini CLI Compatibility:** Includes a valid `gemini-extension.json` manifest utilizing the standard `${extensionPath}` variable.

---

## MCP Tools

The extension exposes two Model Context Protocol (MCP) tools:

### 1. `search_empcloud`
Searches public EmpCloud content using verified WordPress REST API endpoints.

- **Parameters:**
  - `query` (*string*, required): Search keywords or phrases (e.g., `"attendance"`, `"payroll"`, `"HRMS"`, `"biometrics"`).
  - `limit` (*number*, optional, default: 5, min: 1, max: 10): Number of results to return.
- **Output:** Markdown-formatted list containing page titles, clickable URLs, resource types, and summaries.

### 2. `get_empcloud_website_info`
Retrieves general platform metadata and supported modules from the EmpCloud public website.

- **Parameters:** None.
- **Output:** Website title, tagline, canonical URLs, supported workforce management modules, and REST API namespaces.

---

## Requirements

- **Node.js:** v18.0.0 or later (tested on Node v20.20.0 LTS)
- **npm:** v9.0.0 or later
- **Gemini CLI:** [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) (optional for local testing, required for CLI integration)

---

## Installation & Linking

### Option A: Local Development & Linking into Gemini CLI

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-org/empcloud-gemini-extension.git
   cd empcloud-gemini-extension
   ```

2. Install dependencies and compile TypeScript:
   ```bash
   npm install
   npm run build
   ```

3. Link the extension to your local Gemini CLI (creates a symlink for live iteration):
   ```bash
   gemini extensions link .
   ```
   Or install as a standalone local copy:
   ```bash
   gemini extensions install .
   ```

4. Verify that the extension is registered:
   ```bash
   gemini extensions list
   ```

---

## Development Setup & Build

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the TypeScript Project
Compiles the TypeScript source from `src/` to `dist/`:
```bash
npm run build
```

To continuously watch and compile during development:
```bash
npm run watch
```

### 3. Run the MCP Server Standalone
You can start the MCP server directly over standard input/output (stdio):
```bash
npm start
```

---

## Automated & Manual Testing

### Automated Unit Tests (Offline / Mocked)
The automated test suite runs via [Vitest](https://vitest.dev/) with fully mocked HTTP responses to ensure speed and independence from external network availability:
```bash
npm test
```

Test coverage includes:
- **Successful search:** Verifies titles, URLs, and Yoast meta descriptions.
- **Empty search results:** Verifies friendly guidance when no matching pages exist.
- **Input validation:** Rejects empty queries, out-of-bounds limits (`< 1` or `> 10`).
- **Network / Website failure:** Verifies graceful handling of connection failures and timeouts.
- **HTTP status errors:** Verifies handling of 500, 404, and other HTTP status codes.
- **Result clamping:** Ensures limit does not exceed 10.
- **Security & URL filtering:** Validates allowed domains and discards untrusted links.
- **HTML sanitization:** Tests entity decoding and tag stripping.

### Manual Live Integration Test
A live manual test script is provided in `scripts/manual-test.js` to verify real queries against `https://empcloud.com`:
```bash
npm run test:manual
# or directly:
node scripts/manual-test.js
```

---

## Example Prompts

Once installed in the Gemini CLI, you can ask Gemini natural language questions:

- *"Find EmpCloud information about attendance management and show me the relevant links."*
- *"Search EmpCloud for payroll features."*
- *"Find articles about employee monitoring."*
- *"Show me EmpCloud product pages related to HRMS."*
- *"What workforce management modules does EmpCloud offer?"*

Gemini will automatically invoke `search_empcloud` or `get_empcloud_website_info` and format the response.

---

## Architecture & Content Source

### Verified Public Content Sources
1. **Search Endpoint:**
   `https://empcloud.com/wp-json/wp/v2/search?search={query}&per_page={limit}`
   - Returns structured records with `id`, `title`, `url`, `type`, and `subtype`.
2. **Page Detail & Metadata Enrichment:**
   `https://empcloud.com/wp-json/wp/v2/pages/{id}?_fields=id,excerpt,yoast_head_json`
   - Fetches SEO meta descriptions and excerpts to provide summaries without downloading full page bodies.
3. **Site Metadata Endpoint:**
   `https://empcloud.com/wp-json/`
   - Returns public site title, tagline, and supported REST namespaces.

### Project Layout
```text
empcloud-gemini-extension/
├── gemini-extension.json         # Gemini CLI extension manifest
├── GEMINI.md                     # Model instructions context playbook
├── package.json                  # NPM dependencies & scripts
├── tsconfig.json                 # TypeScript build configuration
├── .gitignore                    # Git exclusions
├── LICENSE                       # MIT License
├── README.md                     # Documentation & usage guide
├── src/
│   ├── index.ts                  # MCP server entry point (stdio)
│   ├── wordpress/
│   │   ├── client.ts             # HTTP client with timeouts, validation, sanitization
│   │   └── api.ts                # EmpCloud WordPress API functions
│   └── tools/
│       ├── search-empcloud.ts    # Tool: search_empcloud
│       └── website-info.ts       # Tool: get_empcloud_website_info
├── tests/
│   ├── search-empcloud.test.ts   # Vitest unit test suite (12 tests)
│   └── manual-test.ts            # TypeScript manual test definition
├── scripts/
│   └── manual-test.js            # Node runner for live endpoint test
└── dist/                         # Compiled JavaScript output
```

---

## Security & Reliability

- **Public Data Only:** Only queries public WordPress REST API endpoints.
- **No Credentials Required:** Does not require, store, or accept any user credentials, API keys, or private tokens.
- **Read-Only Operations:** Strictly performs HTTP `GET` requests. No write, update, create, or delete operations exist.
- **Domain Whitelist:** Rejects any response or redirection outside `empcloud.com` and `www.empcloud.com`.
- **Request Timeouts:** All requests utilize `AbortController` with an 8-second default timeout to prevent hanging.
- **Privacy Assurance:** Zero access to private employee data, biometric scans, payroll figures, or customer accounts.

---

## Troubleshooting

### 1. `gemini extensions validate` or `gemini command not found`
If the `gemini` command is not available in your terminal PATH, verify that you have installed the official Gemini CLI:
```bash
npm install -g @google/gemini-cli
# or follow installation instructions at https://github.com/google-gemini/gemini-cli
```
Note: You can develop, build, and test this extension completely independently without having the Gemini CLI installed globally.

### 2. Search returns "Failed to connect to EmpCloud website"
- Verify that your machine has an active internet connection.
- Check if `https://empcloud.com` is reachable in your browser or with `curl -I https://empcloud.com`.
- If behind a corporate proxy, set the `HTTP_PROXY` and `HTTPS_PROXY` environment variables.

### 3. MCP JSON-RPC Communication Error
- Ensure no code writes to `stdout` (`console.log`) during server execution. All logging in `src/index.ts` is routed to `stderr` (`console.error`) to preserve the integrity of the stdio JSON-RPC stream.

---

## GitHub Publishing Instructions

To publish this extension to GitHub as an open-source project or extension registry item:

1. **Initialize Git Repository:**
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of EmpCloud Gemini CLI extension"
   ```

2. **Create Remote Repository on GitHub:**
   - Go to [GitHub New Repository](https://github.com/new).
   - Name the repository `empcloud-gemini-extension`.
   - Set visibility to **Public** (or **Private** based on organizational requirements).
   - Do **not** initialize with README or .gitignore (already present).

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/<your-username-or-org>/empcloud-gemini-extension.git
   git branch -M main
   git push -u origin main
   ```

4. **Tag a Release:**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0: Initial production release"
   git push origin v1.0.0
   ```

5. **Install via Git in Gemini CLI:**
   Users can install the published extension directly via GitHub URL:
   ```bash
   gemini extensions install https://github.com/<your-username-or-org>/empcloud-gemini-extension
   ```

---

## License

This project is licensed under the [MIT License](LICENSE).
