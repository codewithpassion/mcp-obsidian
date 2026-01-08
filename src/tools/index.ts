import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ObsidianClient } from '../obsidian/client.js';
import { registerFileContentsTools } from './file-contents.js';
import { registerFileOperationsTools } from './file-operations.js';
import { registerListFilesTools } from './list-files.js';
import { registerPeriodicNotesTools } from './periodic-notes.js';
import { registerSearchTools } from './search.js';

export function registerAllTools(server: McpServer, client: ObsidianClient): void {
  registerListFilesTools(server, client);
  registerFileContentsTools(server, client);
  registerSearchTools(server, client);
  registerFileOperationsTools(server, client);
  registerPeriodicNotesTools(server, client);
}
