/**
 * Extract and format an Admin project UUID from a Basic project DID.
 * 
 * @param projectId - Either a DID (did:web:api.basic.tech:projects:UUID) or a UUID string
 * @returns Dashed UUID string (8-4-4-4-12) or null if extraction fails
 * 
 * @example
 * extractAdminUuid('did:web:api.basic.tech:projects:701b11bc59a845b581487184d7733e5b')
 * // => '701b11bc-59a8-45b5-8148-7184d7733e5b'
 * 
 * extractAdminUuid('701b11bc59a845b581487184d7733e5b')
 * // => '701b11bc-59a8-45b5-8148-7184d7733e5b'
 * 
 * extractAdminUuid('701b11bc-59a8-45b5-8148-7184d7733e5b')
 * // => '701b11bc-59a8-45b5-8148-7184d7733e5b'
 */
export function extractAdminUuid(projectId: string): string | null {
  // Already a dashed UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
    return projectId.toLowerCase();
  }

  // Bare 32-hex string
  if (/^[0-9a-f]{32}$/i.test(projectId)) {
    const hex = projectId.toLowerCase();
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  // DID format: did:web:api.basic.tech:projects:UUID
  const didMatch = projectId.match(/did:web:[^:]+:projects:([0-9a-f]{32})/i);
  if (didMatch && didMatch[1]) {
    const hex = didMatch[1].toLowerCase();
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  return null;
}
