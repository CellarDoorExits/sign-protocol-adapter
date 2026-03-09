import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryDepartures, SignProtocolQueryError, INDEXING_ENDPOINTS } from '../query.js';

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
  });

  it('throws SignProtocolQueryError on non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    try {
      await queryDepartures({} as any, {
        schemaId: '0x3e',
        indexingValue: '0xblinded',
      });
      expect.fail('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(SignProtocolQueryError);
      expect((err as SignProtocolQueryError).code).toBe('HTTP_ERROR');
      expect((err as SignProtocolQueryError).statusCode).toBe(500);
    }
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

  it('uses custom endpoint when provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { rows: [] } }),
    });

    await queryDepartures({} as any, {
      schemaId: '0x3e',
      indexingValue: '0xblinded',
      endpoint: INDEXING_ENDPOINTS.mainnet,
    });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.origin).toBe('https://mainnet-rpc.sign.global');
  });

  it('throws TIMEOUT error on abort', async () => {
    mockFetch.mockImplementation(() => {
      const err = new DOMException('Aborted', 'AbortError');
      return Promise.reject(err);
    });

    try {
      await queryDepartures({} as any, {
        schemaId: '0x3e',
        indexingValue: '0xblinded',
        timeoutMs: 1,
      });
      expect.fail('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(SignProtocolQueryError);
      expect((err as SignProtocolQueryError).code).toBe('TIMEOUT');
    }
  });

  it('throws NETWORK error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    try {
      await queryDepartures({} as any, {
        schemaId: '0x3e',
        indexingValue: '0xblinded',
      });
      expect.fail('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(SignProtocolQueryError);
      expect((err as SignProtocolQueryError).code).toBe('NETWORK');
    }
  });

  it('exports INDEXING_ENDPOINTS', () => {
    expect(INDEXING_ENDPOINTS.testnet).toContain('testnet');
    expect(INDEXING_ENDPOINTS.mainnet).toContain('mainnet');
  });
});
