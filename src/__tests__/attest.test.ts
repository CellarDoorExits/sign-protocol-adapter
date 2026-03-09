import { describe, it, expect, vi } from 'vitest';
import { computeMarkerHash, attestDeparture, blindIndexingValue } from '../attest.js';
import type { ExitMarkerLike } from '../types.js';

const MOCK_MARKER: ExitMarkerLike = {
  id: 'urn:exit:test:abc123',
  subject: 'did:key:z6MkTest',
  origin: 'did:web:example.com',
  timestamp: 1700000000,
  exitType: 'voluntary',
  status: 'good_standing',
};

describe('computeMarkerHash', () => {
  it('returns a hash and auto-generated salt', () => {
    const result = computeMarkerHash(MOCK_MARKER);
    expect(result.hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(result.salt).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('is deterministic with the same salt', () => {
    const salt = '0x' + 'ab'.repeat(32);
    const a = computeMarkerHash(MOCK_MARKER, salt);
    const b = computeMarkerHash(MOCK_MARKER, salt);
    expect(a.hash).toBe(b.hash);
    expect(a.salt).toBe(b.salt);
  });

  it('produces different hashes with different salts', () => {
    const a = computeMarkerHash(MOCK_MARKER, '0x' + 'aa'.repeat(32));
    const b = computeMarkerHash(MOCK_MARKER, '0x' + 'bb'.repeat(32));
    expect(a.hash).not.toBe(b.hash);
  });

  it('handles ISO-8601 timestamp strings', () => {
    const marker = { ...MOCK_MARKER, timestamp: '2023-11-14T22:13:20.000Z' };
    const result = computeMarkerHash(marker, '0x' + 'cc'.repeat(32));
    expect(result.hash).toMatch(/^0x[a-f0-9]{64}$/);
  });
});

describe('blindIndexingValue', () => {
  it('returns a keccak256 hash', () => {
    const result = blindIndexingValue('did:key:z6MkTest');
    expect(result).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('is deterministic', () => {
    const a = blindIndexingValue('did:key:z6MkTest', 'secret');
    const b = blindIndexingValue('did:key:z6MkTest', 'secret');
    expect(a).toBe(b);
  });

  it('differs with different secrets', () => {
    const a = blindIndexingValue('did:key:z6MkTest', 'secret1');
    const b = blindIndexingValue('did:key:z6MkTest', 'secret2');
    expect(a).not.toBe(b);
  });

  it('differs from no-secret version', () => {
    const a = blindIndexingValue('did:key:z6MkTest');
    const b = blindIndexingValue('did:key:z6MkTest', 'secret');
    expect(a).not.toBe(b);
  });
});

describe('attestDeparture', () => {
  it('creates a privacy-minimal attestation (3 fields only)', async () => {
    const mockClient = {
      createAttestation: vi.fn().mockResolvedValue({ attestationId: '0x99' }),
    } as any;

    const blindedIndex = blindIndexingValue('did:key:z6MkTest', 'deployer-secret');

    const result = await attestDeparture(mockClient, MOCK_MARKER, {
      schemaId: '0x3e',
      indexingValue: blindedIndex,
      vcUri: 'https://example.com/vc/123',
      salt: '0x' + 'dd'.repeat(32),
    });

    expect(result.attestationId).toBe('0x99');
    expect(result.markerHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(result.salt).toBe('0x' + 'dd'.repeat(32));
    expect(result.indexingValue).toBe(blindedIndex);

    const call = mockClient.createAttestation.mock.calls[0][0];
    expect(call.schemaId).toBe('0x3e');
    expect(call.indexingValue).toBe(blindedIndex);

    // Privacy-minimal: only 3 fields on-chain
    expect(call.data.markerHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(call.data.timestamp).toBe(BigInt(1700000000));
    expect(call.data.vcUri).toBe('https://example.com/vc/123');

    // No personal data on-chain
    expect(call.data.exitId).toBeUndefined();
    expect(call.data.subject).toBeUndefined();
    expect(call.data.origin).toBeUndefined();
    expect(call.data.exitType).toBeUndefined();
  });
});
