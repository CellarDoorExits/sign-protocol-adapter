import type { SignProtocolClient } from '@ethsign/sp-sdk';
import { keccak256, encodeAbiParameters, toHex } from 'viem';
import type {
  ExitMarkerLike,
  AttestOptions,
  AttestResult,
  MarkerHashResult,
} from './types.js';

const DOMAIN_SEPARATOR = 'EXIT_PROTOCOL_SIGN_DEPARTURE_v1';

/**
 * Generate a cryptographically random 256-bit salt.
 * Works in Node 18+ (via globalThis.crypto) and browsers.
 */
function randomSalt(): string {
  // Node 18 polyfill check — globalThis.crypto.getRandomValues is available
  // from Node 19+. For Node 18, fall back to node:crypto.
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    return toHex(globalThis.crypto.getRandomValues(new Uint8Array(32)));
  }
  // Dynamic import would be async — instead use require for Node 18 compat
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomBytes } = require('node:crypto');
  return toHex(randomBytes(32));
}

/**
 * Compute a keccak256 commitment hash of a departure marker with mandatory salt.
 *
 * The salt prevents rainbow-table attacks against known marker fields.
 * If no salt is provided, a cryptographically random 256-bit salt is generated.
 *
 * ⚠️ **Store the salt** — you need it to verify the hash later.
 * Treat the salt with the same care as a private key: anyone with the salt
 * can verify what the markerHash commits to.
 */
export function computeMarkerHash(
  marker: ExitMarkerLike,
  salt?: string,
): MarkerHashResult {
  const actualSalt = salt ?? randomSalt();

  const encoded = encodeAbiParameters(
    [
      { type: 'string' },  // domain separator
      { type: 'string' },  // exitId
      { type: 'string' },  // subject
      { type: 'string' },  // origin
      { type: 'string' },  // exitType
      { type: 'uint256' }, // timestamp
      { type: 'bytes32' }, // salt
    ],
    [
      DOMAIN_SEPARATOR,
      marker.id,
      marker.subject,
      marker.origin,
      marker.exitType,
      BigInt(
        typeof marker.timestamp === 'string'
          ? Math.floor(new Date(marker.timestamp).getTime() / 1000)
          : marker.timestamp,
      ),
      actualSalt as `0x${string}`,
    ],
  );

  return {
    hash: keccak256(encoded),
    salt: actualSalt,
  };
}

/**
 * Compute a blinded indexing value from an agent DID.
 *
 * Uses keccak256(agentDID + deployerSecret) so the index is queryable
 * by the deployer but opaque to external observers. Without the secret,
 * an observer cannot enumerate an agent's departure history.
 *
 * If no secret is provided, falls back to keccak256(agentDID) — still
 * better than cleartext but correlatable if the DID is known.
 */
export function blindIndexingValue(
  agentDid: string,
  deployerSecret?: string,
): string {
  const input = deployerSecret
    ? `${agentDid}:${deployerSecret}`
    : agentDid;
  return keccak256(toHex(input));
}

/**
 * Create an EXIT departure attestation via Sign Protocol.
 *
 * Privacy-minimal: only markerHash, timestamp, and vcUri are stored on-chain.
 * All personal data (agent DID, origin, exitType) lives behind the vcUri.
 *
 * ⚠️ **Permissionless attestation risk:** Anyone can create attestations.
 * Consumers should verify the attester address and cross-reference with
 * known operator registries before trusting departure records.
 */
export async function attestDeparture(
  client: SignProtocolClient,
  marker: ExitMarkerLike,
  options: AttestOptions,
): Promise<AttestResult> {
  const { schemaId, indexingValue, vcUri = '', salt } = options;

  const { hash, salt: actualSalt } = computeMarkerHash(marker, salt);

  const timestamp =
    typeof marker.timestamp === 'string'
      ? BigInt(Math.floor(new Date(marker.timestamp).getTime() / 1000))
      : BigInt(marker.timestamp);

  const result = await client.createAttestation({
    schemaId,
    data: {
      markerHash: hash,
      timestamp,
      vcUri,
    },
    indexingValue,
  });

  return {
    attestationId: result.attestationId,
    markerHash: hash,
    salt: actualSalt,
    indexingValue,
  };
}
