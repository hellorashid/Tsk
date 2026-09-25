import { describe, it, expect } from 'vitest';
import { extractAdminUuid } from './extractAdminUuid';

describe('extractAdminUuid', () => {
  const expectedUuid = '701b11bc-59a8-45b5-8148-7184d7733e5b';

  it('should extract UUID from DID format', () => {
    const did = 'did:web:api.basic.tech:projects:701b11bc59a845b581487184d7733e5b';
    expect(extractAdminUuid(did)).toBe(expectedUuid);
  });

  it('should format bare 32-hex string as dashed UUID', () => {
    const bareHex = '701b11bc59a845b581487184d7733e5b';
    expect(extractAdminUuid(bareHex)).toBe(expectedUuid);
  });

  it('should accept already-dashed UUID', () => {
    expect(extractAdminUuid(expectedUuid)).toBe(expectedUuid);
  });

  it('should handle uppercase input', () => {
    const upperDid = 'did:web:api.basic.tech:projects:701B11BC59A845B581487184D7733E5B';
    expect(extractAdminUuid(upperDid)).toBe(expectedUuid);

    const upperHex = '701B11BC59A845B581487184D7733E5B';
    expect(extractAdminUuid(upperHex)).toBe(expectedUuid);

    const upperUuid = '701B11BC-59A8-45B5-8148-7184D7733E5B';
    expect(extractAdminUuid(upperUuid)).toBe(expectedUuid);
  });

  it('should return null for invalid formats', () => {
    expect(extractAdminUuid('')).toBe(null);
    expect(extractAdminUuid('not-a-uuid')).toBe(null);
    expect(extractAdminUuid('701b11bc-59a8')).toBe(null); // incomplete UUID
    expect(extractAdminUuid('did:web:example.com')).toBe(null); // DID without UUID
  });

  it('should validate output against Admin UUID regex', () => {
    // This is the exact regex from @basictech/admin/dist/index.js line 7
    const adminUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const testCases = [
      'did:web:api.basic.tech:projects:701b11bc59a845b581487184d7733e5b',
      '701b11bc59a845b581487184d7733e5b',
      '701b11bc-59a8-45b5-8148-7184d7733e5b',
    ];

    testCases.forEach((input) => {
      const result = extractAdminUuid(input);
      expect(result).not.toBe(null);
      expect(adminUuidRegex.test(result!)).toBe(true);
    });
  });

  it('should convert the real PROJECT_ID from basic.config.ts', () => {
    // This is the actual PROJECT_ID from apps/web/basic.config.ts
    const realProjectId = 'did:web:api.basic.tech:projects:701b11bc59a845b581487184d7733e5b';
    const result = extractAdminUuid(realProjectId);
    
    expect(result).toBe(expectedUuid);
    
    // Verify it passes the Admin UUID regex
    const adminUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(adminUuidRegex.test(result!)).toBe(true);
  });
});
