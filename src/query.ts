import type { SignProtocolClient } from '@ethsign/sp-sdk';
import type { QueryOptions, DepartureAttestation } from './types.js';

/**
 * Query EXIT departure attestations via Sign Protocol's indexing service.
 *
 * Uses a blinded indexing value (from blindIndexingValue()) to find departure
 * records without exposing the raw agent DID in the query.
 *
 * ⚠️ **Permissionless attestation risk:** Query results may include
 * attestations created by untrusted parties. Always verify the attester
 * address against known operator registries.
 *
 * ⚠️ **Third-party indexing:** This endpoint is operated by EthSign.
 * For privacy-critical deployments, scan on-chain events directly instead
 * of relying on the centralized indexing service.
 */
export async function queryDepartures(
  _client: SignProtocolClient,
  options: QueryOptions,
): Promise<DepartureAttestation[]> {
  const { schemaId, indexingValue, page = 1 } = options;

  // Sign Protocol indexing service endpoint
  const url = new URL('https://testnet-rpc.sign.global/api/index/attestations');
  url.searchParams.set('schemaId', schemaId);
  url.searchParams.set('indexingValue', indexingValue);
  url.searchParams.set('page', String(page));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Sign Protocol indexing query failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as {
    data?: { rows?: Array<Record<string, unknown>> };
  };

  const rows = json?.data?.rows ?? [];

  return rows.map((row: Record<string, unknown>) => {
    const data = (row.data ?? {}) as Record<string, unknown>;
    return {
      attestationId: String(row.id ?? row.attestationId ?? ''),
      markerHash: (data.markerHash ?? '0x') as `0x${string}`,
      timestamp: BigInt(String(data.timestamp ?? '0')),
      vcUri: String(data.vcUri ?? ''),
      revoked: Boolean(row.revoked ?? false),
      attester: row.attester ? String(row.attester) : undefined,
    };
  });
}
