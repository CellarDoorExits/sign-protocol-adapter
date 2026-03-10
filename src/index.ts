export { createExitClient } from './client.js';
export { registerDepartureSchema, EXIT_DEPARTURE_SCHEMA, registerArrivalSchema, EXIT_ARRIVAL_SCHEMA } from './schema.js';
export { attestDeparture, computeMarkerHash, blindIndexingValue, verifyMarkerHash, attestArrival, computeArrivalHash, verifyArrivalHash } from './attest.js';
export { queryDepartures, queryArrivals, INDEXING_ENDPOINTS, SignProtocolQueryError } from './query.js';
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
  ArrivalMarkerLike,
  ArrivalAttestOptions,
  ArrivalAttestResult,
  ArrivalAttestation,
} from './types.js';
