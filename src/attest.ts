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
 * Compute a keccak256 commitment hash of a departure marker with mandatory salt.
 *
 * The salt prevents rainbow-table attacks against known marker fields.
 * If no salt is provided, a cryptographically random 256-bit salt is generated.
 *
 * ⚠️ **Store the salt** — you need it to verify the hash later.
 */
export function computeMarkerHash(
  marker: ExitMarkerLike,
  salt?: string,
): MarkerHashResult {
  const actualSalt =
    salt ?? toHex(crypto.getRandomValues(new Uint8Array(32)));

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
 * Create an EXIT departure attestation via Sign Protocol.
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
      exitId: marker.id,
      subject: marker.subject,
      origin: marker.origin,
      exitType: marker.exitType,
      timestamp,
      markerHash: hash,
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
