import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ObsidianClient } from '../obsidian/client.js';
import { jsonResult, textResult } from './types.js';

export function registerFileContentsTools(server: McpServer, client: ObsidianClient): void {
  server.registerTool(
    'obsidian_get_file_contents',
    {
      title: 'Get File Contents',
      description: 'Return the content of a single file in your vault.',
      inputSchema: {
        filepath: z.string().describe('Path to the relevant file (relative to your vault root).'),
      },
    },
    async ({ filepath }) => {
      const content = await client.getFileContents(filepath);
      return jsonResult(content);
    }
  );

  server.registerTool(
    'obsidian_batch_get_file_contents',
    {
      title: 'Batch Get File Contents',
      description:
        'Return the contents of multiple files in your vault, concatenated with headers.',
      inputSchema: {
        filepaths: z.array(z.string()).describe('List of file paths to read'),
      },
    },
    async ({ filepaths }) => {
      const content = await client.getBatchFileContents(filepaths);
      return textResult(content);
    }
  );
}
