import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ObsidianClient } from '../obsidian/client.js';
import { textResult } from './types.js';

export function registerFileOperationsTools(server: McpServer, client: ObsidianClient): void {
  server.registerTool(
    'obsidian_append_content',
    {
      title: 'Append Content',
      description: 'Append content to a new or existing file in the vault.',
      inputSchema: {
        filepath: z.string().describe('Path to the file (relative to vault root)'),
        content: z.string().describe('Content to append to the file'),
      },
    },
    async ({ filepath, content }) => {
      await client.appendContent(filepath, content);
      return textResult(`Successfully appended content to ${filepath}`);
    }
  );

  server.registerTool(
    'obsidian_patch_content',
    {
      title: 'Patch Content',
      description:
        'Insert content into an existing note relative to a heading, block reference, or frontmatter field.',
      inputSchema: {
        filepath: z.string().describe('Path to the file (relative to vault root)'),
        operation: z
          .enum(['append', 'prepend', 'replace'])
          .describe('Operation to perform (append, prepend, or replace)'),
        target_type: z
          .enum(['heading', 'block', 'frontmatter'])
          .describe('Type of target to patch'),
        target: z
          .string()
          .describe('Target identifier (heading path, block reference, or frontmatter field)'),
        content: z.string().describe('Content to insert'),
      },
    },
    async ({ filepath, operation, target_type, target, content }) => {
      await client.patchContent(filepath, operation, target_type, target, content);
      return textResult(`Successfully patched content in ${filepath}`);
    }
  );

  server.registerTool(
    'obsidian_put_content',
    {
      title: 'Put Content',
      description:
        'Create a new file in your vault or update the content of an existing one in your vault.',
      inputSchema: {
        filepath: z.string().describe('Path to the relevant file (relative to your vault root)'),
        content: z.string().describe('Content of the file you would like to upload'),
      },
    },
    async ({ filepath, content }) => {
      await client.putContent(filepath, content);
      return textResult(`Successfully uploaded content to ${filepath}`);
    }
  );

  server.registerTool(
    'obsidian_delete_file',
    {
      title: 'Delete File',
      description: 'Delete a file or directory from the vault.',
      inputSchema: {
        filepath: z
          .string()
          .describe('Path to the file or directory to delete (relative to vault root)'),
        confirm: z.boolean().describe('Confirmation to delete the file (must be true)'),
      },
    },
    async ({ filepath, confirm }) => {
      if (!confirm) {
        throw new Error('confirm must be set to true to delete a file');
      }
      await client.deleteFile(filepath);
      return textResult(`Successfully deleted ${filepath}`);
    }
  );
}
