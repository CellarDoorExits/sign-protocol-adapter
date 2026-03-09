import { describe, it, expect, vi } from 'vitest';
import { EXIT_DEPARTURE_SCHEMA, registerDepartureSchema } from '../schema.js';

describe('EXIT_DEPARTURE_SCHEMA', () => {
  it('has the correct field names', () => {
    const names = EXIT_DEPARTURE_SCHEMA.data.map((d) => d.name);
    expect(names).toEqual([
      'exitId',
      'subject',
      'origin',
      'exitType',
      'timestamp',
      'markerHash',
      'vcUri',
    ]);
  });

  it('is revocable', () => {
    expect(EXIT_DEPARTURE_SCHEMA.revocable).toBe(true);
  });
});

describe('registerDepartureSchema', () => {
  it('calls createSchema and returns schemaId', async () => {
    const mockClient = {
      createSchema: vi.fn().mockResolvedValue({ schemaId: '0x42' }),
    } as any;

    const result = await registerDepartureSchema(mockClient);
    expect(result.schemaId).toBe('0x42');
    expect(mockClient.createSchema).toHaveBeenCalledWith(EXIT_DEPARTURE_SCHEMA);
  });
});
