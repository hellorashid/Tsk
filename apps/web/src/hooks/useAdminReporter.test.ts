import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { BasicClient, BasicSchema, BasicClientSnapshot } from '@basictech/core';

// Mock the admin module with factory function
const mockStop = vi.fn();
const mockReport = vi.fn();
const mockStartAdminUserReporting = vi.fn(() => ({
  report: mockReport,
  stop: mockStop,
}));

vi.mock('@basictech/admin', () => ({
  startAdminUserReporting: mockStartAdminUserReporting,
}));

// Mock the PROJECT_ID
vi.mock('../basic', () => ({
  PROJECT_ID: 'did:web:api.basic.tech:projects:701b11bc59a845b581487184d7733e5b',
  basic: {
    client: {} as any,
  },
}));

describe('useAdminReporter', () => {
  let mockClient: BasicClient<BasicSchema>;
  let mockSnapshot: BasicClientSnapshot;

  beforeEach(async () => {
    // Reset module to clear activeReporter state
    vi.resetModules();
    
    // Reset all mocks
    vi.clearAllMocks();

    mockSnapshot = {
      isReady: true,
      authStatus: 'authenticated' as const,
      isAnonymous: false,
      did: 'did:web:example.com:user:123',
      isSignedIn: true,
      canWrite: true,
      readOnlyReason: null,
      authError: null,
      user: { 
        sub: '123', 
        pds_url: 'https://pds.example.com', 
        id: '123', 
        name: 'Test User', 
        handle: 'testuser', 
        email: 'test@example.com', 
        picture: undefined, 
        kind: 'user' 
      },
      handle: 'testuser',
      accounts: [],
      activeAccount: null,
      syncStatus: 'online' as const,
      pendingCount: 0,
      rejected: [],
      conflicts: [],
      mode: 'sync' as const,
      repos: [],
      defaultRepoId: null,
    };

    mockClient = {
      subscribe: vi.fn((_listener: () => void) => {
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

  it('should call startAdminUserReporting exactly once with correct params', async () => {
    const { useAdminReporter } = await import('./useAdminReporter');
    
    renderHook(() => useAdminReporter(mockClient));

    expect(mockStartAdminUserReporting).toHaveBeenCalledTimes(1);
    
    // Get the call arguments (using any to bypass TypeScript's initial empty tuple type)
    const call = (mockStartAdminUserReporting.mock.calls[0] as any)[0];
    
    // Verify all parameters
    expect(call.projectId).toBe('701b11bc-59a8-45b5-8148-7184d7733e5b');
    expect(call.adminUrl).toBe('https://api.basic.tech');
    expect(call.activity).toBe(true);
    expect(call.client).toBeDefined();
    
    // Verify the client adapter passes through the right snapshot structure
    expect(typeof call.client.subscribe).toBe('function');
    expect(typeof call.client.getSnapshot).toBe('function');
    
    const adapterSnapshot = call.client.getSnapshot();
    expect(adapterSnapshot.isReady).toBe(mockSnapshot.isReady);
    expect(adapterSnapshot.authStatus).toBe(mockSnapshot.authStatus);
    expect(adapterSnapshot.isAnonymous).toBe(mockSnapshot.isAnonymous);
    expect(adapterSnapshot.did).toBe(mockSnapshot.did);
  });

  it('should call stop() on unmount', async () => {
    const { useAdminReporter } = await import('./useAdminReporter');
    
    const { unmount } = renderHook(() => useAdminReporter(mockClient));
    
    expect(mockStop).not.toHaveBeenCalled();
    
    unmount();
    
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it('should not start a second concurrent reporter when rendered twice', async () => {
    const { useAdminReporter } = await import('./useAdminReporter');
    
    // First render
    renderHook(() => useAdminReporter(mockClient));
    
    expect(mockStartAdminUserReporting).toHaveBeenCalledTimes(1);
    
    // Second render (simulates StrictMode or re-render)
    renderHook(() => useAdminReporter(mockClient));
    
    // Should still only be called once due to module-level guard
    expect(mockStartAdminUserReporting).toHaveBeenCalledTimes(1);
  });

  it('should not throw if startAdminUserReporting throws', async () => {
    // Make startAdminUserReporting throw
    mockStartAdminUserReporting.mockImplementationOnce(() => {
      throw new Error('Admin reporter startup failed');
    });

    const { useAdminReporter } = await import('./useAdminReporter');
    
    // Should not throw - error is caught and logged
    expect(() => {
      renderHook(() => useAdminReporter(mockClient));
    }).not.toThrow();
    
    // Should log the error
    expect(console.warn).toHaveBeenCalledWith(
      '[Admin] Failed to start reporting (non-critical):',
      expect.any(Error)
    );
  });
});
