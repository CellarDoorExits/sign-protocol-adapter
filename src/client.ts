import { SignProtocolClient, SpMode, EvmChains } from '@ethsign/sp-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import type { ExitClientOptions } from './types.js';

/**
 * Create a SignProtocolClient configured for EXIT departure attestations.
 *
 * @example
 * ```typescript
 * const client = createExitClient({
 *   privateKey: '0xabc...',
 *   chain: EvmChains.baseSepolia,
 * });
 * ```
 */
export function createExitClient(options: ExitClientOptions): SignProtocolClient {
  const {
    privateKey,
    chain = EvmChains.baseSepolia,
    mode = SpMode.OnChain,
  } = options;

  const account = privateKeyToAccount(privateKey);

  if (mode === SpMode.OffChain) {
    return new SignProtocolClient(SpMode.OffChain, {
      account,
    } as any);
  }

  return new SignProtocolClient(SpMode.OnChain, {
    chain,
    account,
  });
}
