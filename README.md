# @cellar-door/sign-protocol 𓉸

> Anchor EXIT departure markers as privacy-minimal on-chain attestations via [Sign Protocol](https://sign.global).

⚠️ **Pre-release software.** No formal security audit has been performed. Use at your own risk. Report vulnerabilities to hawthornhollows@gmail.com.

## What This Does

EXIT markers are verifiable departure records for AI agents. This package anchors them on-chain as Sign Protocol attestations — non-transferable, permanent, queryable records on any EVM chain supported by Sign Protocol.

**Privacy-minimal design:** Only 3 fields are stored on-chain (`markerHash`, `timestamp`, `vcUri`). No personal data (agent DID, origin, exitType) touches the chain. Full marker data lives behind the `vcUri` where it can be access-controlled, encrypted, or deleted (GDPR Art. 17).

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
  blindIndexingValue,
  queryDepartures,
  verifyMarkerHash,
  INDEXING_ENDPOINTS,
} from '@cellar-door/sign-protocol';
import { EvmChains } from '@ethsign/sp-sdk';

// 1. Create a client
const client = createExitClient({
  privateKey: '0xabc...',
  chain: EvmChains.baseSepolia,
});

// 2. Register the EXIT schema (one-time, costs gas)
const { schemaId } = await registerDepartureSchema(client);

// 3. Create a blinded index (never expose raw DID)
const DEPLOYER_SECRET = process.env.DEPLOYER_SECRET!;
const blindedIndex = blindIndexingValue('did:key:z6MkAgent...', DEPLOYER_SECRET);

// 4. Create a departure attestation
const result = await attestDeparture(client, {
  id: 'urn:exit:platform:agent-abc:1700000000',
  subject: 'did:key:z6MkAgent...',
  origin: 'did:web:platform.example.com',
  timestamp: 1700000000,
  exitType: 'voluntary',
  status: 'good_standing',
}, {
  schemaId,
  indexingValue: blindedIndex,
  vcUri: 'https://example.com/vc/departure/123',
});

console.log(result.attestationId); // '0x...'
console.log(result.markerHash);    // '0x...' (keccak256 commitment)
console.log(result.salt);          // '0x...' (store securely!)

// 5. Query departures
const departures = await queryDepartures(client, {
  schemaId,
  indexingValue: blindedIndex,
  endpoint: INDEXING_ENDPOINTS.mainnet, // or .testnet
});

// 6. Verify a hash against a marker
const valid = verifyMarkerHash(marker, result.markerHash, result.salt);
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

Create a privacy-minimal attestation. Only `markerHash`, `timestamp`, and `vcUri` are stored on-chain. Returns `{ attestationId, markerHash, salt, indexingValue }`.

### `blindIndexingValue(agentDid, deployerSecret)`

Compute a blinded index from an agent DID. The deployer secret is **required** — without it, the index is brute-forceable against known DID sets.

### `queryDepartures(client, options)`

Query attestations via Sign Protocol's indexing service. Supports configurable endpoint and timeout.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `schemaId` | `string` | required | Schema ID |
| `indexingValue` | `string` | required | Blinded index |
| `page` | `number` | `1` | Page number |
| `endpoint` | `string` | testnet | Indexing service URL |
| `timeoutMs` | `number` | `10000` | Fetch timeout |

### `verifyMarkerHash(marker, expectedHash, salt)`

Verify a marker hash against a marker and salt. Returns `true` if the commitment matches.

### `computeMarkerHash(marker, salt?)`

Compute a keccak256 commitment hash with mandatory salt. Auto-generates 256-bit random salt if not provided.

### `revokeDeparture(client, attestationId, options?)`

Revoke an attestation. Only the original attester can revoke. **Revocation marks the record but does not delete it.**

## On-Chain Schema

Privacy-minimal — no personal data on-chain:

| Field | Type | Description |
|-------|------|-------------|
| `markerHash` | `bytes32` | Salted keccak256 commitment |
| `timestamp` | `uint256` | Unix timestamp |
| `vcUri` | `string` | URI to full Verifiable Credential |

## Security Considerations

See [SECURITY.md](./SECURITY.md) for full details.

- **Salt = private key.** Anyone with the salt can verify what the markerHash commits to. Store it with the same care as a private key.
- **Permissionless attestations.** Anyone can create attestations. Always verify the attester address against known operator registries.
- **Blinded indexing required.** Never use raw agent DIDs as indexingValue — they create a departure history oracle queryable by anyone.
- **Third-party indexing.** `queryDepartures()` uses EthSign's centralized indexing service. For privacy-critical deployments, scan on-chain events directly.
- **Revocation ≠ erasure.** Revoking an attestation marks it but does not delete on-chain data.
- **Arweave (off-chain mode).** Permanent, unjurisdictional storage. Data cannot be erased under any circumstances, including GDPR Art. 17 requests.

## Ecosystem

| Package | Language | Description |
|---------|----------|-------------|
| [cellar-door-exit](https://github.com/CellarDoorExits/exit-door) | TypeScript | Core protocol (reference impl) |
| [cellar-door-exit](https://github.com/CellarDoorExits/exit-python) | Python | Core protocol |
| [cellar-door-entry](https://github.com/CellarDoorExits/entry-door) | TypeScript | Arrival/entry markers |
| [@cellar-door/langchain](https://github.com/CellarDoorExits/langchain) | TypeScript | LangChain integration |
| [cellar-door-langchain](https://github.com/CellarDoorExits/cellar-door-langchain-python) | Python | LangChain integration |
| [@cellar-door/vercel-ai-sdk](https://github.com/CellarDoorExits/vercel-ai-sdk) | TypeScript | Vercel AI SDK |
| [@cellar-door/mcp-server](https://github.com/CellarDoorExits/mcp-server) | TypeScript | MCP server |
| [@cellar-door/eliza](https://github.com/CellarDoorExits/eliza-exit) | TypeScript | ElizaOS plugin |
| [@cellar-door/eas](https://github.com/CellarDoorExits/eas-adapter) | TypeScript | EAS attestation anchoring |
| [@cellar-door/erc-8004](https://github.com/CellarDoorExits/erc-8004-adapter) | TypeScript | ERC-8004 identity/reputation |
| **[@cellar-door/sign-protocol](https://github.com/CellarDoorExits/sign-protocol-adapter)** | **TypeScript** | **Sign Protocol attestation ← you are here** |

**[Paper](https://cellar-door.dev/paper/) · [Website](https://cellar-door.dev)**

## License

Apache-2.0 — see [LICENSE](./LICENSE).
