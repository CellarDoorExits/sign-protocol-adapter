import type { SignProtocolClient } from '@ethsign/sp-sdk';
import { keccak256, toHex, type Hex } from 'viem';
import {
  computeMarkerHash as coreComputeMarkerHash,
  computeArrivalHash as coreComputeArrivalHash,
} from '@cellar-door/attestation-core';
import type {
  ExitMarkerLike,
  AttestOptions,
  AttestResult,
  MarkerHashResult,
  ArrivalMarkerLike,
  ArrivalAttestOptions,
  ArrivalAttestResult,
} from './types.js';

const BLIND_INDEX_DOMAIN = 'EXIT_BLIND_INDEX_v1';

/**
 * Compute a keccak256 commitment hash of a departure marker with mandatory salt.
 *
 * Delegates to @cellar-door/attestation-core for cross-adapter consistency.
 * All adapters (EAS, Sign Protocol, ERC-8004) now produce identical hashes
 * for the same marker + salt combination.
 *
 * ⚠️ **Store the salt** — you need it to verify the hash later.
 */
export function computeMarkerHash(
  marker: ExitMarkerLike,
  salt?: string,
): MarkerHashResult {
  return coreComputeMarkerHash(marker, salt as Hex | undefined);
}

/**
 * Compute a blinded indexing value from an agent DID and deployer secret.
 *
 * Uses keccak256(domain + agentDID + secret) so the index is queryable
 * by the deployer but opaque to external observers. Without the secret,
 * an observer cannot enumerate an agent's departure history.
 *
 * The secret is **required** — without it, the index is brute-forceable
 * against known DID sets (DIDs are public identifiers).
 */
export function blindIndexingValue(
  agentDid: string,
  deployerSecret: string,
): Hex {
  // Domain-separated to prevent cross-protocol collision
  const input = `${BLIND_INDEX_DOMAIN}:${agentDid}:${deployerSecret}`;
  return keccak256(toHex(input));
}

/**
 * Verify a marker hash against a marker and salt.
 *
 * Delegates to @cellar-door/attestation-core for cross-adapter consistency.
 */
export { verifyMarkerHash } from '@cellar-door/attestation-core';

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

/**
 * Compute a keccak256 commitment hash of an arrival marker with mandatory salt.
 *
 * Delegates to @cellar-door/attestation-core for cross-adapter consistency.
 */
export function computeArrivalHash(
  marker: ArrivalMarkerLike,
  salt?: string,
): MarkerHashResult {
  return coreComputeArrivalHash(marker, salt as Hex | undefined);
}

/**
 * Verify an arrival hash against a marker and salt.
 *
 * Delegates to @cellar-door/attestation-core for cross-adapter consistency.
 */
export { verifyArrivalHash } from '@cellar-door/attestation-core';

/**
 * Create an EXIT arrival attestation via Sign Protocol.
 *
 * Privacy-minimal: only arrivalHash, timestamp, and departureRef are stored.
 * Links to the corresponding departure attestation via departureRef.
 */
export async function attestArrival(
  client: SignProtocolClient,
  marker: ArrivalMarkerLike,
  options: ArrivalAttestOptions,
): Promise<ArrivalAttestResult> {
  const { schemaId, indexingValue, departureRef = marker.departureRef ?? '', salt } = options;

  const { hash, salt: actualSalt } = computeArrivalHash(marker, salt);

  const timestamp =
    typeof marker.timestamp === 'string'
      ? BigInt(Math.floor(new Date(marker.timestamp).getTime() / 1000))
      : BigInt(marker.timestamp);

  const result = await client.createAttestation({
    schemaId,
    data: {
      arrivalHash: hash,
      timestamp,
      departureRef,
    },
    indexingValue,
  });

  return {
    attestationId: result.attestationId,
    arrivalHash: hash,
    salt: actualSalt,
    indexingValue,
    departureRef,
  };
}
