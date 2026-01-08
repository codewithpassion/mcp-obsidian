import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ObsidianClient } from '../obsidian/client.js';
import { jsonResult } from './types.js';

export function registerListFilesTools(server: McpServer, client: ObsidianClient): void {
  server.registerTool(
    'obsidian_list_files_in_vault',
    {
      title: 'List Files in Vault',
      description: 'Lists all files and directories in the root directory of your Obsidian vault.',
      inputSchema: {},
    },
    async () => {
      const files = await client.listFilesInVault();
      return jsonResult(files);
    }
  );

  server.registerTool(
    'obsidian_list_files_in_dir',
    {
      title: 'List Files in Directory',
      description: 'Lists all files and directories that exist in a specific Obsidian directory.',
      inputSchema: {
        dirpath: z
          .string()
          .describe(
            'Path to list files from (relative to your vault root). Note that empty directories will not be returned.'
          ),
      },
    },
    async ({ dirpath }) => {
      const files = await client.listFilesInDir(dirpath);
      return jsonResult(files);
    }
  );
}
