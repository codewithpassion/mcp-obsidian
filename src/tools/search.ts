import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ObsidianClient } from '../obsidian/client.js';
import { jsonResult } from './types.js';

export function registerSearchTools(server: McpServer, client: ObsidianClient): void {
  server.registerTool(
    'obsidian_simple_search',
    {
      title: 'Simple Search',
      description:
        'Simple search for documents matching a specified text query across all files in the vault. Use this tool when you want to do a simple text search.',
      inputSchema: {
        query: z.string().describe('Text to search for in the vault.'),
        context_length: z
          .number()
          .optional()
          .default(100)
          .describe('How much context to return around the matching string (default: 100)'),
      },
    },
    async ({ query, context_length }) => {
      const results = await client.search(query, context_length);

      const formattedResults = results.map((result) => ({
        filename: result.filename,
        score: result.score,
        matches: result.matches.map((match) => ({
          context: match.context,
          match_position: { start: match.match.start, end: match.match.end },
        })),
      }));

      return jsonResult(formattedResults);
    }
  );

  server.registerTool(
    'obsidian_complex_search',
    {
      title: 'Complex Search',
      description: `Complex search for documents using a JsonLogic query.
Supports standard JsonLogic operators plus 'glob' and 'regexp' for pattern matching. Results must be non-falsy.

Use this tool when you want to do a complex search, e.g. for all documents with certain tags etc.
ALWAYS follow query syntax in examples.

Examples:
1. Match all markdown files:
   {"glob": ["*.md", {"var": "path"}]}

2. Match all markdown files with 1221 substring inside them:
   {"and": [{"glob": ["*.md", {"var": "path"}]}, {"regexp": [".*1221.*", {"var": "content"}]}]}

3. Match all markdown files in Work folder containing name Keaton:
   {"and": [{"glob": ["*.md", {"var": "path"}]}, {"regexp": [".*Work.*", {"var": "path"}]}, {"regexp": ["Keaton", {"var": "content"}]}]}`,
      inputSchema: {
        query: z.record(z.unknown()).describe('JsonLogic query object'),
      },
    },
    async ({ query }) => {
      const results = await client.searchJson(query);
      return jsonResult(results);
    }
  );
}
