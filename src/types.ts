import type { EvmChains, SpMode } from '@ethsign/sp-sdk';
import type { Hex } from 'viem';

// ═══════════════════════════════════════════
// EXIT Marker Types
// ═══════════════════════════════════════════

export type ExitType = 'voluntary' | 'forced' | 'emergency' | 'keyCompromise' | 'platform_shutdown' | 'directed' | 'constructive' | 'acquisition';
export type ExitStatus = 'good_standing' | 'disputed' | 'unverified';

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
  /**
   * Indexing value for Sign Protocol queries.
   * Use blindIndexingValue() to derive a privacy-preserving index
   * instead of passing the raw agent DID.
   */
  indexingValue: string;
  /** Optional URI to the Verifiable Credential */
  vcUri?: string;
  /** Optional pre-computed salt for markerHash (auto-generated if omitted) */
  salt?: string;
}

export interface AttestResult {
  attestationId: string;
  markerHash: Hex;
  salt: Hex;
  indexingValue: Hex;
}

// ═══════════════════════════════════════════
// Query Options & Results
// ═══════════════════════════════════════════

export interface QueryOptions {
  /** Schema ID to filter by */
  schemaId: string;
  /**
   * Blinded indexing value (from blindIndexingValue()).
   * Raw agent DIDs should NOT be used here — they expose departure history.
   */
  indexingValue: string;
  /** Page number (default: 1) */
  page?: number;
  /** Custom indexing endpoint URL (default: Sign Protocol testnet) */
  endpoint?: string;
  /** Fetch timeout in milliseconds (default: 10000) */
  timeoutMs?: number;
}

/**
 * Privacy-minimal departure attestation as returned from on-chain queries.
 * Personal data (agent DID, origin, exitType) is NOT stored on-chain —
 * retrieve it from the vcUri if access-controlled.
 */
export interface DepartureAttestation {
  attestationId: string;
  markerHash: Hex;
  timestamp: bigint;
  vcUri: string;
  revoked: boolean;
  /** Attester address (for trust verification) */
  attester?: string;
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
// Arrival Types
// ═══════════════════════════════════════════

export interface ArrivalMarkerLike {
  id: string;
  subject: string;
  destination: string;
  timestamp: string | number;
  departureRef?: string;
}

export interface ArrivalAttestOptions {
  /** Schema ID from registerArrivalSchema() */
  schemaId: string;
  /** Blinded indexing value */
  indexingValue: string;
  /** Attestation ID of the linked departure */
  departureRef?: string;
  /** Optional pre-computed salt for arrivalHash */
  salt?: string;
}

export interface ArrivalAttestResult {
  attestationId: string;
  arrivalHash: Hex;
  salt: Hex;
  indexingValue: string;
  departureRef: string;
}

export interface ArrivalAttestation {
  attestationId: string;
  arrivalHash: Hex;
  timestamp: bigint;
  departureRef: string;
  revoked: boolean;
  attester?: string;
}

// ═══════════════════════════════════════════
// Hash Result
// ═══════════════════════════════════════════

export interface MarkerHashResult {
  hash: Hex;
  salt: Hex;
}
