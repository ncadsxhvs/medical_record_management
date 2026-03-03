import { NextRequest } from 'next/server';

export const TEST_USER_ID = 'test-user-id';

export function buildRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
  } = {}
): NextRequest {
  const { method = 'GET', body } = options;
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url, 'http://localhost:3001'), init);
}

export async function parseResponse(response: Response) {
  const status = response.status;
  const json = await response.json();
  return { status, json };
}

export function createMockSql() {
  const fn = jest.fn().mockResolvedValue({ rows: [] });
  fn.query = jest.fn().mockResolvedValue({ rows: [] });
  return fn;
}
