import type { SignProtocolClient } from '@ethsign/sp-sdk';

/**
 * EXIT Protocol departure schema for Sign Protocol.
 *
 * Privacy-minimal design: only the commitment hash, timestamp, and a URI
 * to the full Verifiable Credential are stored on-chain/Arweave. All personal
 * data (agent DID, origin, exitType) lives behind the vcUri where it can be
 * access-controlled, encrypted, or deleted (GDPR Art. 17).
 *
 * Fields:
 * - markerHash:  keccak256 commitment hash (includes mandatory salt)
 * - timestamp:   Unix timestamp (seconds)
 * - vcUri:       URI to the full Verifiable Credential
 */
export const EXIT_DEPARTURE_SCHEMA = {
  name: 'EXIT Departure Anchor',
  description:
    'Privacy-minimal departure anchor for AI agents per the EXIT Protocol (cellar-door.dev). Full marker data lives at vcUri.',
  data: [
    { name: 'markerHash', type: 'bytes32' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'vcUri', type: 'string' },
  ],
  revocable: true,
};

/**
 * Register the EXIT departure schema on-chain. One-time operation per chain (costs gas).
 *
 * @returns The schema ID to use for attestations.
 */
export async function registerDepartureSchema(
  client: SignProtocolClient,
): Promise<{ schemaId: string }> {
  const result = await client.createSchema(
    EXIT_DEPARTURE_SCHEMA as unknown as Parameters<typeof client.createSchema>[0],
  );
  return { schemaId: result.schemaId };
}

/**
 * EXIT Protocol arrival schema for Sign Protocol.
 *
 * Privacy-minimal design matching the departure pattern: only the commitment
 * hash, timestamp, and a reference to the departure attestation are stored.
 *
 * Fields:
 * - arrivalHash:   keccak256 commitment hash (includes mandatory salt)
 * - timestamp:     Unix timestamp (seconds)
 * - departureRef:  Attestation ID of the linked departure record
 */
export const EXIT_ARRIVAL_SCHEMA = {
  name: 'EXIT Arrival Anchor',
  description:
    'Privacy-minimal arrival anchor for AI agents per the EXIT Protocol (cellar-door.dev). Links back to a departure attestation.',
  data: [
    { name: 'arrivalHash', type: 'bytes32' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'departureRef', type: 'string' },
  ],
  revocable: true,
};

/**
 * Register the EXIT arrival schema on-chain. One-time operation per chain (costs gas).
 *
 * @returns The schema ID to use for arrival attestations.
 */
export async function registerArrivalSchema(
  client: SignProtocolClient,
): Promise<{ schemaId: string }> {
  const result = await client.createSchema(
    EXIT_ARRIVAL_SCHEMA as unknown as Parameters<typeof client.createSchema>[0],
  );
  return { schemaId: result.schemaId };
}
