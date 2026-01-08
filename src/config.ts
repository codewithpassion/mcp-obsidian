import 'dotenv/config';

export interface Config {
  obsidianApiKey: string;
  obsidianHost: string;
  obsidianPort: number;
  obsidianProtocol: 'http' | 'https';
  serverPort: number;
  verifySsl: boolean;
}

export function loadConfig(): Config {
  const apiKey = process.env.OBSIDIAN_API_KEY;
  if (!apiKey) {
    throw new Error(
      `OBSIDIAN_API_KEY environment variable required. Working directory: ${process.cwd()}`
    );
  }

  const protocol = process.env.OBSIDIAN_PROTOCOL?.toLowerCase();

  return {
    obsidianApiKey: apiKey,
    obsidianHost: process.env.OBSIDIAN_HOST ?? '127.0.0.1',
    obsidianPort: Number.parseInt(process.env.OBSIDIAN_PORT ?? '27124', 10),
    obsidianProtocol: protocol === 'http' ? 'http' : 'https',
    serverPort: Number.parseInt(process.env.SERVER_PORT ?? '3000', 10),
    verifySsl: process.env.OBSIDIAN_VERIFY_SSL === 'true',
  };
}
