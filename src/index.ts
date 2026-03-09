export { createExitClient } from './client.js';
export { registerDepartureSchema, EXIT_DEPARTURE_SCHEMA } from './schema.js';
export { attestDeparture, computeMarkerHash, blindIndexingValue, verifyMarkerHash } from './attest.js';
export { queryDepartures } from './query.js';
export { revokeDeparture } from './revoke.js';
export type {
  ExitClientOptions,
  ExitMarkerLike,
  ExitType,
  ExitStatus,
  AttestOptions,
  AttestResult,
  QueryOptions,
  DepartureAttestation,
  RevokeOptions,
  RevokeResult,
  MarkerHashResult,
} from './types.js';
