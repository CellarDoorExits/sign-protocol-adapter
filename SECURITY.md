# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this package, please report it responsibly.

**Email:** hawthornhollows@gmail.com

**Do not** open a public GitHub issue for security vulnerabilities.

## Scope

This package wraps Sign Protocol's SDK for EXIT Protocol attestations. Security concerns may include:

- Hash computation weaknesses in `computeMarkerHash()`
- Salt generation or handling issues
- Data leakage through attestation fields
- Permissionless attestation spoofing vectors

## Known Considerations

- **Permissionless attestations:** Anyone can create attestations for any schema. Consumers must verify the attester address against trusted operator registries.
- **On-chain data permanence:** Attestation data is permanently visible on-chain, even after revocation. Do not include sensitive personal data in attestation fields.
- **Salt storage:** The marker hash salt must be stored securely. Loss of salt means inability to verify the commitment.
