import { describe, it, expect, vi } from 'vitest';
import { EXIT_DEPARTURE_SCHEMA, registerDepartureSchema } from '../schema.js';

describe('EXIT_DEPARTURE_SCHEMA', () => {
  it('has exactly 3 privacy-minimal fields', () => {
    const names = EXIT_DEPARTURE_SCHEMA.data.map((d) => d.name);
    expect(names).toEqual(['markerHash', 'timestamp', 'vcUri']);
  });

  it('does not contain personal data fields', () => {
    const names = EXIT_DEPARTURE_SCHEMA.data.map((d) => d.name);
    expect(names).not.toContain('exitId');
    expect(names).not.toContain('subject');
    expect(names).not.toContain('origin');
    expect(names).not.toContain('exitType');
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
    expect(mockClient.createSchema).toHaveBeenCalled();
  });
});
