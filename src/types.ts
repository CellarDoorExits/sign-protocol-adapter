import type { EvmChains, SpMode } from '@ethsign/sp-sdk';

// ═══════════════════════════════════════════
// EXIT Marker Types
// ═══════════════════════════════════════════

export type ExitType = 'voluntary' | 'involuntary' | 'emergency';
export type ExitStatus = 'good_standing' | 'suspended' | 'terminated' | 'disputed';

export interface ExitMarkerLike {
  id: string;
  subject: string;
  origin: string;
  timestamp: string | number;
  exitType: ExitType;
  status: ExitStatus;
  selfAttested?: boolean;
  lineageHash?: string;
}

// ═══════════════════════════════════════════
// Client Options
// ═══════════════════════════════════════════

export interface ExitClientOptions {
  /** Private key as hex string (0x-prefixed) */
  privateKey: `0x${string}`;
  /** Target chain (default: baseSepolia) */
  chain?: EvmChains;
  /** SpMode (default: OnChain) */
  mode?: SpMode;
}

// ═══════════════════════════════════════════
// Attest Options & Results
// ═══════════════════════════════════════════

export interface AttestOptions {
  /** Schema ID from registerDepartureSchema() */
  schemaId: string;
  /** Agent DID — used as indexingValue for per-agent queries */
  indexingValue: string;
  /** Optional URI to the Verifiable Credential */
  vcUri?: string;
  /** Optional pre-computed salt for markerHash (auto-generated if omitted) */
  salt?: string;
}

export interface AttestResult {
  attestationId: string;
  markerHash: `0x${string}`;
  salt: string;
  indexingValue: string;
}

// ═══════════════════════════════════════════
// Query Options & Results
// ═══════════════════════════════════════════

export interface QueryOptions {
  /** Schema ID to filter by */
  schemaId: string;
  /** Agent DID to query departures for */
  indexingValue: string;
  /** Page number (default: 1) */
  page?: number;
}

export interface DepartureAttestation {
  attestationId: string;
  exitId: string;
  subject: string;
  origin: string;
  exitType: string;
  timestamp: bigint;
  markerHash: `0x${string}`;
  vcUri: string;
  revoked: boolean;
}

// ═══════════════════════════════════════════
// Revoke Options & Results
// ═══════════════════════════════════════════

export interface RevokeOptions {
  reason?: string;
}

export interface RevokeResult {
  attestationId: string;
  revoked: boolean;
}

// ═══════════════════════════════════════════
// Hash Result
// ═══════════════════════════════════════════

export interface MarkerHashResult {
  hash: `0x${string}`;
  salt: string;
}
