import type { SignProtocolClient } from '@ethsign/sp-sdk';

/**
 * EXIT Protocol departure schema for Sign Protocol.
 *
 * Fields:
 * - exitId:      Unique departure identifier (urn:exit:...)
 * - subject:     Agent DID (did:key, did:ethr, did:pkh)
 * - origin:      Platform DID (did:web, etc.)
 * - exitType:    voluntary | involuntary | emergency
 * - timestamp:   Unix timestamp (seconds)
 * - markerHash:  keccak256 commitment hash (includes mandatory salt)
 * - vcUri:       URI to the full Verifiable Credential
 */
export const EXIT_DEPARTURE_SCHEMA = {
  name: 'EXIT Protocol Departure Record',
  description:
    'Cryptographic departure record for AI agents per the EXIT Protocol (cellar-door.dev)',
  data: [
    { name: 'exitId', type: 'string' },
    { name: 'subject', type: 'string' },
    { name: 'origin', type: 'string' },
    { name: 'exitType', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'markerHash', type: 'bytes32' },
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
  const result = await client.createSchema(EXIT_DEPARTURE_SCHEMA as any);
  return { schemaId: result.schemaId };
}
