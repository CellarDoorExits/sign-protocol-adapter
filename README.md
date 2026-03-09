# @cellar-door/sign-protocol 𓉸

> Anchor EXIT departure markers as on-chain attestations via [Sign Protocol](https://sign.global).

⚠️ **Pre-release software.** No formal security audit has been performed. Use at your own risk.

## What This Does

EXIT markers are verifiable departure records for AI agents. This package anchors them on-chain as Sign Protocol attestations — non-transferable, permanent, queryable records on any EVM chain supported by Sign Protocol.

## Install

```bash
npm install @cellar-door/sign-protocol viem
```

## Quick Start

```typescript
import {
  createExitClient,
  registerDepartureSchema,
  attestDeparture,
  queryDepartures,
  revokeDeparture,
} from '@cellar-door/sign-protocol';
import { EvmChains } from '@ethsign/sp-sdk';

// 1. Create a client
const client = createExitClient({
  privateKey: '0xabc...',
  chain: EvmChains.baseSepolia,
});

// 2. Register the EXIT schema (one-time, costs gas)
const { schemaId } = await registerDepartureSchema(client);

// 3. Create a departure attestation
const result = await attestDeparture(client, {
  id: 'urn:exit:platform:agent-abc:1700000000',
  subject: 'did:key:z6MkAgent...',
  origin: 'did:web:platform.example.com',
  timestamp: 1700000000,
  exitType: 'voluntary',
  status: 'good_standing',
}, {
  schemaId,
  indexingValue: 'did:key:z6MkAgent...',
  vcUri: 'https://example.com/vc/departure/123',
});

console.log(result.attestationId); // '0x...'
console.log(result.markerHash);    // '0x...' (keccak256 commitment)
console.log(result.salt);          // '0x...' (store this!)

// 4. Query departures for an agent
const departures = await queryDepartures(client, {
  schemaId,
  indexingValue: 'did:key:z6MkAgent...',
});

// 5. Revoke if needed
await revokeDeparture(client, result.attestationId, {
  reason: 'Superseded by updated record',
});
```

## API

### `createExitClient(options)`

Create a `SignProtocolClient` configured for EXIT departures.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `privateKey` | `` `0x${string}` `` | required | Hex private key |
| `chain` | `EvmChains` | `baseSepolia` | Target chain |
| `mode` | `SpMode` | `OnChain` | On-chain or off-chain |

### `registerDepartureSchema(client)`

Register the EXIT departure schema on-chain. Returns `{ schemaId }`.

### `attestDeparture(client, marker, options)`

Create an attestation. Returns `{ attestationId, markerHash, salt, indexingValue }`.

### `queryDepartures(client, options)`

Query attestations via Sign Protocol's indexing service.

### `revokeDeparture(client, attestationId, options?)`

Revoke an attestation. Only the original attester can revoke.

### `computeMarkerHash(marker, salt?)`

Compute a keccak256 commitment hash with mandatory salt. Auto-generates salt if not provided.

## Schema

The EXIT departure schema includes:

| Field | Type | Description |
|-------|------|-------------|
| `exitId` | `string` | Unique departure ID (`urn:exit:...`) |
| `subject` | `string` | Agent DID |
| `origin` | `string` | Platform DID |
| `exitType` | `string` | `voluntary` / `involuntary` / `emergency` |
| `timestamp` | `uint256` | Unix timestamp |
| `markerHash` | `bytes32` | Salted keccak256 commitment |
| `vcUri` | `string` | URI to full Verifiable Credential |

## Security Considerations

- **Permissionless attestations:** Anyone can create attestations for any schema. Always verify the attester address against known operator registries before trusting departure records.
- **On-chain permanence:** Attestation data is permanent. Revocation marks records but does not delete them.
- **Salt management:** The salt used in `markerHash` must be stored securely. Without it, the commitment cannot be verified.
- **Off-chain mode requires API key:** If using `SpMode.OffChain`, you need a Sign Protocol API key.

## License

Apache-2.0 — see [LICENSE](./LICENSE).
