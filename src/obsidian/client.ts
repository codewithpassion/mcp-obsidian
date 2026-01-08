import type { Config } from '../config.js';

export interface SearchMatch {
  context: string;
  match: { start: number; end: number };
}

export interface SearchResult {
  filename: string;
  score: number;
  matches: SearchMatch[];
}

export interface FileInfo {
  files: string[];
}

interface ErrorResponse {
  errorCode?: number;
  message?: string;
}

export class ObsidianClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number = 6000;

  constructor(config: Config) {
    this.baseUrl = `${config.obsidianProtocol}://${config.obsidianHost}:${config.obsidianPort}`;
    this.apiKey = config.obsidianApiKey;
  }

  private getHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      ...extra,
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(options.headers as Record<string, string>),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ErrorResponse;
        const code = errorData.errorCode ?? -1;
        const message = errorData.message ?? '<unknown>';
        throw new Error(`Error ${code}: ${message}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return response.json() as Promise<T>;
      }
      return response.text() as unknown as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async listFilesInVault(): Promise<string[]> {
    const result = await this.request<FileInfo>('/vault/');
    return result.files;
  }

  async listFilesInDir(dirpath: string): Promise<string[]> {
    const result = await this.request<FileInfo>(`/vault/${dirpath}/`);
    return result.files;
  }

  async getFileContents(filepath: string): Promise<string> {
    return this.request<string>(`/vault/${filepath}`);
  }

  async getBatchFileContents(filepaths: string[]): Promise<string> {
    const results: string[] = [];
    for (const filepath of filepaths) {
      try {
        const content = await this.getFileContents(filepath);
        results.push(`# ${filepath}\n\n${content}\n\n---\n\n`);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        results.push(`# ${filepath}\n\nError reading file: ${message}\n\n---\n\n`);
      }
    }
    return results.join('');
  }

  async search(query: string, contextLength = 100): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      query,
      contextLength: String(contextLength),
    });
    return this.request<SearchResult[]>(`/search/simple/?${params}`, {
      method: 'POST',
    });
  }

  async searchJson(query: object): Promise<string[]> {
    return this.request<string[]>('/search/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/vnd.olrapi.jsonlogic+json' },
      body: JSON.stringify(query),
    });
  }

  async appendContent(filepath: string, content: string): Promise<void> {
    await this.request(`/vault/${filepath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/markdown' },
      body: content,
    });
  }

  async patchContent(
    filepath: string,
    operation: string,
    targetType: string,
    target: string,
    content: string
  ): Promise<void> {
    await this.request(`/vault/${filepath}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'text/markdown',
        Operation: operation,
        'Target-Type': targetType,
        Target: encodeURIComponent(target),
      },
      body: content,
    });
  }

  async putContent(filepath: string, content: string): Promise<void> {
    await this.request(`/vault/${filepath}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/markdown' },
      body: content,
    });
  }

  async deleteFile(filepath: string): Promise<void> {
    await this.request(`/vault/${filepath}`, { method: 'DELETE' });
  }

  async getPeriodicNote(period: string, type: 'content' | 'metadata' = 'content'): Promise<string> {
    const headers: Record<string, string> = {};
    if (type === 'metadata') {
      headers.Accept = 'application/vnd.olrapi.note+json';
    }
    return this.request<string>(`/periodic/${period}/`, { headers });
  }

  async getRecentPeriodicNotes(
    period: string,
    limit = 5,
    includeContent = false
  ): Promise<unknown[]> {
    const params = new URLSearchParams({
      limit: String(limit),
      includeContent: String(includeContent),
    });
    return this.request<unknown[]>(`/periodic/${period}/recent?${params}`);
  }

  async getRecentChanges(limit = 10, days = 90): Promise<unknown[]> {
    const dqlQuery = [
      'TABLE file.mtime',
      `WHERE file.mtime >= date(today) - dur(${days} days)`,
      'SORT file.mtime DESC',
      `LIMIT ${limit}`,
    ].join('\n');

    return this.request<unknown[]>('/search/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/vnd.olrapi.dataview.dql+txt' },
      body: dqlQuery,
    });
  }
}
