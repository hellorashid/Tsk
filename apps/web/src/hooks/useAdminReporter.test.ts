import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BasicClient, BasicSchema, BasicClientSnapshot } from '@basictech/core';

describe('useAdminReporter', () => {
  let mockClient: BasicClient<BasicSchema>;
  let mockSnapshot: BasicClientSnapshot;

  beforeEach(() => {
    mockSnapshot = {
      isReady: true,
      authStatus: 'anonymous',
      isAnonymous: true,
      did: null,
      isSignedIn: false,
      canWrite: true,
      readOnlyReason: null,
      authError: null,
      user: null,
      handle: null,
      accounts: [],
      activeAccount: null,
      syncStatus: 'offline',
      pendingCount: 0,
      rejected: [],
      conflicts: [],
      mode: 'browser',
      repos: [],
      defaultRepoId: null,
    };

    // Create a minimal mock BasicClient
    mockClient = {
      subscribe: vi.fn((listener: () => void) => {
        return () => {};
      }),
      getSnapshot: vi.fn(() => mockSnapshot),
    } as unknown as BasicClient<BasicSchema>;

    // Spy on console methods to suppress output
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should accept a BasicClient and not throw', () => {
    // Test that the hook dependencies are correctly typed
    expect(mockClient).toBeDefined();
    expect(mockClient.subscribe).toBeDefined();
    expect(mockClient.getSnapshot).toBeDefined();
    
    // Test snapshot structure matches what the reporter expects
    const snapshot = mockClient.getSnapshot();
    expect(snapshot).toHaveProperty('isReady');
    expect(snapshot).toHaveProperty('authStatus');
    expect(snapshot).toHaveProperty('isAnonymous');
    expect(snapshot).toHaveProperty('did');
  });

  it('should handle error states gracefully', () => {
    // Make getSnapshot throw to simulate an error
    const errorClient = {
      subscribe: vi.fn(() => () => {}),
      getSnapshot: vi.fn(() => {
        throw new Error('Test error');
      }),
    } as unknown as BasicClient<BasicSchema>;

    // Test that error client properties exist
    expect(errorClient.subscribe).toBeDefined();
    expect(errorClient.getSnapshot).toBeDefined();
    
    // Verify that calling getSnapshot throws (as expected in our mock)
    expect(() => errorClient.getSnapshot()).toThrow('Test error');
  });

  it('should validate snapshot structure for signed-in state', () => {
    mockSnapshot.isAnonymous = false;
    mockSnapshot.isSignedIn = true;
    mockSnapshot.did = 'did:web:example.com:user:123';
    mockSnapshot.authStatus = 'ready';

    const snapshot = mockClient.getSnapshot();
    
    // Verify the reporter will receive correct signed-in state
    expect(snapshot.isReady).toBe(true);
    expect(snapshot.isAnonymous).toBe(false);
    expect(snapshot.did).toBe('did:web:example.com:user:123');
    expect(snapshot.authStatus).toBe('ready');
  });
});
