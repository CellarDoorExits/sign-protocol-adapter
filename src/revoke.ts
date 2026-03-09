import type { SignProtocolClient } from '@ethsign/sp-sdk';
import type { RevokeOptions, RevokeResult } from './types.js';

/**
 * Revoke an EXIT departure attestation.
 *
 * Only the original attester can revoke. Revocation is permanent on-chain
 * but the attestation data remains visible (marked as revoked).
 */
export async function revokeDeparture(
  client: SignProtocolClient,
  attestationId: string,
  options?: RevokeOptions,
): Promise<RevokeResult> {
  await client.revokeAttestation(attestationId, {
    reason: options?.reason ?? 'Departure record revoked',
  });

  return {
    attestationId,
    revoked: true,
  };
}
