# EmpCloud Extension Playbook & Context

This extension integrates public EmpCloud product and resource discovery directly into the Gemini CLI via Model Context Protocol (MCP).

## Extension Capabilities & Tools

1. **`search_empcloud`**:
   - Searches public EmpCloud products, features, articles, and documentation from `https://empcloud.com`.
   - Arguments:
     - `query` (string, required): Search keywords or phrases (e.g., `"attendance"`, `"payroll"`, `"HRMS"`, `"monitoring"`).
     - `limit` (integer, optional, default: 5, max: 10): Number of results to return.
   - Use this tool whenever the user asks for links, documentation, features, or specifics about EmpCloud solutions.

2. **`get_empcloud_website_info`**:
   - Retrieves high-level information about EmpCloud, its platform tagline, canonical URL, and list of core workforce management modules.
   - Arguments: None.
   - Use this tool when the user asks general questions such as "What is EmpCloud?", "What modules does EmpCloud support?", or wants a summary of the EmpCloud platform.

## Response Guidelines

- **Always provide clickable links**: When presenting search results, format titles as Markdown links `[Title](URL)` and include the brief summary and resource type.
- **Accurate Information**: Only refer to modules, documentation, and pages confirmed by the tool results. Do not hallucinate URLs or features.
- **Privacy & Safety**: All queries search verified, public website content only. No customer accounts, private databases, or confidential employee records are accessed.
