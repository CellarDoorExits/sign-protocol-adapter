import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryDepartures } from '../query.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('queryDepartures', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('queries the indexing service and parses minimal results', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            rows: [
              {
                id: '0xabc',
                revoked: false,
                attester: '0x1234567890abcdef1234567890abcdef12345678',
                data: {
                  markerHash: '0x' + 'ff'.repeat(32),
                  timestamp: '1700000000',
                  vcUri: 'https://example.com/vc/1',
                },
              },
            ],
          },
        }),
    });

    const results = await queryDepartures({} as any, {
      schemaId: '0x3e',
      indexingValue: '0xblindedindex',
    });

    expect(results).toHaveLength(1);
    expect(results[0].attestationId).toBe('0xabc');
    expect(results[0].markerHash).toBe('0x' + 'ff'.repeat(32));
    expect(results[0].vcUri).toBe('https://example.com/vc/1');
    expect(results[0].revoked).toBe(false);
    expect(results[0].attester).toBe('0x1234567890abcdef1234567890abcdef12345678');

    // No personal data fields
    expect((results[0] as any).exitId).toBeUndefined();
    expect((results[0] as any).subject).toBeUndefined();
    expect((results[0] as any).origin).toBeUndefined();

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get('schemaId')).toBe('0x3e');
    expect(url.searchParams.get('indexingValue')).toBe('0xblindedindex');
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
        indexingValue: '0xblinded',
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
      indexingValue: '0xblinded',
    });

    expect(results).toEqual([]);
  });
});
