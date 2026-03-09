import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryDepartures } from '../query.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('queryDepartures', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('queries the indexing service and parses results', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            rows: [
              {
                id: '0xabc',
                revoked: false,
                data: {
                  exitId: 'urn:exit:test:1',
                  subject: 'did:key:z6MkTest',
                  origin: 'did:web:example.com',
                  exitType: 'voluntary',
                  timestamp: '1700000000',
                  markerHash: '0x' + 'ff'.repeat(32),
                  vcUri: 'https://example.com/vc/1',
                },
              },
            ],
          },
        }),
    });

    const results = await queryDepartures({} as any, {
      schemaId: '0x3e',
      indexingValue: 'did:key:z6MkTest',
    });

    expect(results).toHaveLength(1);
    expect(results[0].attestationId).toBe('0xabc');
    expect(results[0].exitId).toBe('urn:exit:test:1');
    expect(results[0].revoked).toBe(false);

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get('schemaId')).toBe('0x3e');
    expect(url.searchParams.get('indexingValue')).toBe('did:key:z6MkTest');
  });

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      queryDepartures({} as any, {
        schemaId: '0x3e',
        indexingValue: 'did:key:z6MkTest',
      }),
    ).rejects.toThrow('Sign Protocol indexing query failed');
  });

  it('returns empty array when no rows', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { rows: [] } }),
    });

    const results = await queryDepartures({} as any, {
      schemaId: '0x3e',
      indexingValue: 'did:key:z6MkTest',
    });

    expect(results).toEqual([]);
  });
});
