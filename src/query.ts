import type { SignProtocolClient } from '@ethsign/sp-sdk';
import type { QueryOptions, DepartureAttestation, ArrivalAttestation } from './types.js';

/** Default Sign Protocol indexing endpoints by network. */
export const INDEXING_ENDPOINTS = {
  testnet: 'https://testnet-rpc.sign.global/api/index/attestations',
  mainnet: 'https://mainnet-rpc.sign.global/api/index/attestations',
} as const;

/** Default fetch timeout (10 seconds). */
const DEFAULT_TIMEOUT_MS = 10_000;

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
 * ⚠️ **Third-party indexing:** This endpoint is operated by EthSign (Singapore).
 * For privacy-critical deployments, scan on-chain events directly instead
 * of relying on the centralized indexing service.
 */
export async function queryDepartures(
  _client: SignProtocolClient,
  options: QueryOptions,
): Promise<DepartureAttestation[]> {
  const {
    schemaId,
    indexingValue,
    page = 1,
    endpoint = INDEXING_ENDPOINTS.testnet,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const url = new URL(endpoint);
  url.searchParams.set('schemaId', schemaId);
  url.searchParams.set('indexingValue', indexingValue);
  url.searchParams.set('page', String(page));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url.toString(), { signal: controller.signal });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new SignProtocolQueryError(
        `Sign Protocol query timed out after ${timeoutMs}ms`,
        'TIMEOUT',
      );
    }
    throw new SignProtocolQueryError(
      `Sign Protocol query failed: ${err instanceof Error ? err.message : String(err)}`,
      'NETWORK',
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new SignProtocolQueryError(
      `Sign Protocol indexing query failed: ${res.status} ${res.statusText}`,
      'HTTP_ERROR',
      res.status,
    );
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

/**
 * Query EXIT arrival attestations via Sign Protocol's indexing service.
 */
export async function queryArrivals(
  _client: SignProtocolClient,
  options: QueryOptions,
): Promise<ArrivalAttestation[]> {
  const {
    schemaId,
    indexingValue,
    page = 1,
    endpoint = INDEXING_ENDPOINTS.testnet,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const url = new URL(endpoint);
  url.searchParams.set('schemaId', schemaId);
  url.searchParams.set('indexingValue', indexingValue);
  url.searchParams.set('page', String(page));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url.toString(), { signal: controller.signal });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new SignProtocolQueryError(
        `Sign Protocol query timed out after ${timeoutMs}ms`,
        'TIMEOUT',
      );
    }
    throw new SignProtocolQueryError(
      `Sign Protocol query failed: ${err instanceof Error ? err.message : String(err)}`,
      'NETWORK',
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new SignProtocolQueryError(
      `Sign Protocol indexing query failed: ${res.status} ${res.statusText}`,
      'HTTP_ERROR',
      res.status,
    );
  }

  const json = (await res.json()) as {
    data?: { rows?: Array<Record<string, unknown>> };
  };

  const rows = json?.data?.rows ?? [];

  return rows.map((row: Record<string, unknown>) => {
    const data = (row.data ?? {}) as Record<string, unknown>;
    return {
      attestationId: String(row.id ?? row.attestationId ?? ''),
      arrivalHash: (data.arrivalHash ?? '0x') as `0x${string}`,
      timestamp: BigInt(String(data.timestamp ?? '0')),
      departureRef: String(data.departureRef ?? ''),
      revoked: Boolean(row.revoked ?? false),
      attester: row.attester ? String(row.attester) : undefined,
    };
  });
}

/**
 * Structured error for Sign Protocol query failures.
 */
export class SignProtocolQueryError extends Error {
  readonly code: 'TIMEOUT' | 'NETWORK' | 'HTTP_ERROR';
  readonly statusCode?: number;

  constructor(
    message: string,
    code: 'TIMEOUT' | 'NETWORK' | 'HTTP_ERROR',
    statusCode?: number,
  ) {
    super(message);
    this.name = 'SignProtocolQueryError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
