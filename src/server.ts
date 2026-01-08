import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Config } from './config.js';
import { ObsidianClient } from './obsidian/client.js';
import { registerAllTools } from './tools/index.js';

export function createMcpServer(config: Config): McpServer {
  const server = new McpServer({
    name: 'mcp-obsidian',
    version: '0.3.0',
  });

  const obsidianClient = new ObsidianClient(config);
  registerAllTools(server, obsidianClient);

  return server;
}
