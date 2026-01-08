import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ObsidianClient } from '../obsidian/client.js';
import { jsonResult, textResult } from './types.js';

const periodSchema = z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);

export function registerPeriodicNotesTools(server: McpServer, client: ObsidianClient): void {
  server.registerTool(
    'obsidian_get_periodic_note',
    {
      title: 'Get Periodic Note',
      description: 'Get current periodic note for the specified period.',
      inputSchema: {
        period: periodSchema.describe(
          'The period type (daily, weekly, monthly, quarterly, yearly)'
        ),
        type: z
          .enum(['content', 'metadata'])
          .optional()
          .default('content')
          .describe(
            "The type of data to get ('content' or 'metadata'). 'content' returns just the content in Markdown format. 'metadata' includes note metadata (including paths, tags, etc.) and the content."
          ),
      },
    },
    async ({ period, type }) => {
      const content = await client.getPeriodicNote(period, type);
      return textResult(content);
    }
  );

  server.registerTool(
    'obsidian_get_recent_periodic_notes',
    {
      title: 'Get Recent Periodic Notes',
      description: 'Get most recent periodic notes for the specified period type.',
      inputSchema: {
        period: periodSchema.describe(
          'The period type (daily, weekly, monthly, quarterly, yearly)'
        ),
        limit: z
          .number()
          .min(1)
          .max(50)
          .optional()
          .default(5)
          .describe('Maximum number of notes to return (default: 5)'),
        include_content: z
          .boolean()
          .optional()
          .default(false)
          .describe('Whether to include note content (default: false)'),
      },
    },
    async ({ period, limit, include_content }) => {
      const results = await client.getRecentPeriodicNotes(period, limit, include_content);
      return jsonResult(results);
    }
  );

  server.registerTool(
    'obsidian_get_recent_changes',
    {
      title: 'Get Recent Changes',
      description: 'Get recently modified files in the vault.',
      inputSchema: {
        limit: z
          .number()
          .min(1)
          .max(100)
          .optional()
          .default(10)
          .describe('Maximum number of files to return (default: 10)'),
        days: z
          .number()
          .min(1)
          .optional()
          .default(90)
          .describe('Only include files modified within this many days (default: 90)'),
      },
    },
    async ({ limit, days }) => {
      const results = await client.getRecentChanges(limit, days);
      return jsonResult(results);
    }
  );
}
