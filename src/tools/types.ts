export interface ToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
}

export function textResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }] };
}

export function jsonResult(data: unknown): ToolResult {
  return textResult(JSON.stringify(data, null, 2));
}
