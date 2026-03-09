# Security Policy

## Reporting Vulnerabilities

Report security issues to **hawthornhollows@gmail.com**.

Do NOT open public issues for security vulnerabilities.

## Pre-Release Notice

This package is pre-release software (v0.x). It has NOT undergone a formal security audit.

## Security Considerations

### Salt as Secret
The marker hash salt is functionally a decryption key. Anyone with the salt can verify what the `markerHash` commits to. **Treat the salt with the same care as a private key.**

### Permissionless Attestations
Sign Protocol attestations are permissionless. Anyone can create departure attestations for any agent. Consumers MUST verify the attester address against known operator registries before trusting departure records.

### Third-Party Indexing
The `queryDepartures()` function uses Sign Protocol's centralized indexing service (`testnet-rpc.sign.global`), operated by EthSign. For privacy-critical deployments, scan on-chain events directly.

### Blinded Indexing
Use `blindIndexingValue(agentDid, deployerSecret)` instead of raw agent DIDs. Without blinding, anyone can enumerate an agent's complete departure history via a single HTTP GET.

### Revocation ≠ Erasure
Revoking an attestation marks it as revoked but does NOT delete the on-chain data. The attestation remains readable by anyone. Design your system with this in mind.

### Arweave (Off-Chain Mode)
Arweave storage is permanent and unjurisdictional. Data stored on Arweave cannot be erased under any circumstances, including GDPR Art. 17 requests. The privacy-minimal schema (3 fields, no personal data) mitigates this, but operators should understand the permanence guarantee before enabling off-chain mode.
