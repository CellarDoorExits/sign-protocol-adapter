import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeArrivalHash, attestArrival, blindIndexingValue, verifyArrivalHash } from '../attest.js';
import { EXIT_ARRIVAL_SCHEMA, registerArrivalSchema } from '../schema.js';
import { queryArrivals, SignProtocolQueryError } from '../query.js';
import type { ArrivalMarkerLike } from '../types.js';

const MOCK_ARRIVAL: ArrivalMarkerLike = {
  id: 'urn:exit:arrival:test:xyz789',
  subject: 'did:key:z6MkTest',
  destination: 'did:web:newhost.example.com',
  timestamp: 1700001000,
  departureRef: '0x99',
};

// ═══════════════════════════════════════════
// Schema
// ═══════════════════════════════════════════

describe('EXIT_ARRIVAL_SCHEMA', () => {
  it('has exactly 3 privacy-minimal fields', () => {
    const names = EXIT_ARRIVAL_SCHEMA.data.map((d) => d.name);
    expect(names).toEqual(['arrivalHash', 'timestamp', 'departureRef']);
  });

  it('does not contain personal data fields', () => {
    const names = EXIT_ARRIVAL_SCHEMA.data.map((d) => d.name);
    expect(names).not.toContain('subject');
    expect(names).not.toContain('destination');
  });

  it('is revocable', () => {
    expect(EXIT_ARRIVAL_SCHEMA.revocable).toBe(true);
  });
});

describe('registerArrivalSchema', () => {
  it('calls createSchema and returns schemaId', async () => {
    const mockClient = {
      createSchema: vi.fn().mockResolvedValue({ schemaId: '0x55' }),
    } as any;

    const result = await registerArrivalSchema(mockClient);
    expect(result.schemaId).toBe('0x55');
    expect(mockClient.createSchema).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════
// Hash
// ═══════════════════════════════════════════

describe('computeArrivalHash', () => {
  it('returns a hash and auto-generated salt', () => {
    const result = computeArrivalHash(MOCK_ARRIVAL);
    expect(result.hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(result.salt).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('is deterministic with the same salt', () => {
    const salt = '0x' + 'ab'.repeat(32);
    const a = computeArrivalHash(MOCK_ARRIVAL, salt);
    const b = computeArrivalHash(MOCK_ARRIVAL, salt);
    expect(a.hash).toBe(b.hash);
  });

  it('produces different hashes with different salts', () => {
    const a = computeArrivalHash(MOCK_ARRIVAL, '0x' + 'aa'.repeat(32));
    const b = computeArrivalHash(MOCK_ARRIVAL, '0x' + 'bb'.repeat(32));
    expect(a.hash).not.toBe(b.hash);
  });

  it('handles ISO-8601 timestamp strings', () => {
    const marker = { ...MOCK_ARRIVAL, timestamp: '2023-11-14T22:30:00.000Z' };
    const result = computeArrivalHash(marker, '0x' + 'cc'.repeat(32));
    expect(result.hash).toMatch(/^0x[a-f0-9]{64}$/);
  });
});

describe('verifyArrivalHash', () => {
  it('returns true for matching hash+salt', () => {
    const salt = '0x' + 'ab'.repeat(32);
    const { hash } = computeArrivalHash(MOCK_ARRIVAL, salt);
    expect(verifyArrivalHash(MOCK_ARRIVAL, hash, salt)).toBe(true);
  });

  it('returns false for wrong salt', () => {
    const { hash } = computeArrivalHash(MOCK_ARRIVAL, '0x' + 'ab'.repeat(32));
    expect(verifyArrivalHash(MOCK_ARRIVAL, hash, '0x' + 'cd'.repeat(32))).toBe(false);
  });
});

// ═══════════════════════════════════════════
// Attest
// ═══════════════════════════════════════════

describe('attestArrival', () => {
  it('creates a privacy-minimal arrival attestation', async () => {
    const mockClient = {
      createAttestation: vi.fn().mockResolvedValue({ attestationId: '0xA1' }),
    } as any;

    const blindedIndex = blindIndexingValue('did:key:z6MkTest', 'deployer-secret');

    const result = await attestArrival(mockClient, MOCK_ARRIVAL, {
      schemaId: '0x55',
      indexingValue: blindedIndex,
      departureRef: '0x99',
      salt: '0x' + 'dd'.repeat(32),
    });

    expect(result.attestationId).toBe('0xA1');
    expect(result.arrivalHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(result.salt).toBe('0x' + 'dd'.repeat(32));
    expect(result.departureRef).toBe('0x99');

    const call = mockClient.createAttestation.mock.calls[0][0];
    expect(call.schemaId).toBe('0x55');
    expect(call.data.arrivalHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(call.data.timestamp).toBe(BigInt(1700001000));
    expect(call.data.departureRef).toBe('0x99');

    // No personal data on-chain
    expect(call.data.subject).toBeUndefined();
    expect(call.data.destination).toBeUndefined();
  });

  it('uses marker.departureRef as fallback', async () => {
    const mockClient = {
      createAttestation: vi.fn().mockResolvedValue({ attestationId: '0xA2' }),
    } as any;

    const result = await attestArrival(mockClient, MOCK_ARRIVAL, {
      schemaId: '0x55',
      indexingValue: '0xblinded',
    });

    expect(result.departureRef).toBe('0x99');
  });
});

// ═══════════════════════════════════════════
// Query
// ═══════════════════════════════════════════

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('queryArrivals', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('queries and parses arrival attestations', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            rows: [
              {
                id: '0xA1',
                revoked: false,
                attester: '0x1234567890abcdef1234567890abcdef12345678',
                data: {
                  arrivalHash: '0x' + 'ee'.repeat(32),
                  timestamp: '1700001000',
                  departureRef: '0x99',
                },
              },
            ],
          },
        }),
    });

    const results = await queryArrivals({} as any, {
      schemaId: '0x55',
      indexingValue: '0xblindedindex',
    });

    expect(results).toHaveLength(1);
    expect(results[0].attestationId).toBe('0xA1');
    expect(results[0].arrivalHash).toBe('0x' + 'ee'.repeat(32));
    expect(results[0].departureRef).toBe('0x99');
    expect(results[0].revoked).toBe(false);
  });

  it('returns empty array when no rows', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { rows: [] } }),
    });

    const results = await queryArrivals({} as any, {
      schemaId: '0x55',
      indexingValue: '0xblinded',
    });

    expect(results).toEqual([]);
  });

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(
      queryArrivals({} as any, { schemaId: '0x55', indexingValue: '0xblinded' }),
    ).rejects.toThrow(SignProtocolQueryError);
  });
});
