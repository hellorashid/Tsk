import { useEffect, useRef } from 'react';
import { startAdminUserReporting, type ReportingClient } from '@basictech/admin';
import { PROJECT_ID } from '../basic';
import { extractAdminUuid } from '../utils/extractAdminUuid';
import type { BasicClient, BasicSchema } from '@basictech/core';

// Module-level flag to prevent duplicate reporters across StrictMode/HMR
let activeReporter: ReturnType<typeof startAdminUserReporting> | null = null;

/**
 * Initialize Basic Admin user directory and activity reporting.
 * Reports signed-in usage to admin.basic.tech for directory discovery
 * and daily active use when enabled.
 */
export function useAdminReporter<S extends BasicSchema = BasicSchema>(client: BasicClient<S>) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Guard: Only initialize once per app lifetime
    if (hasInitialized.current || activeReporter) {
      return;
    }

    hasInitialized.current = true;

    try {
      // Extract Admin UUID from DID
      const adminUuid = extractAdminUuid(PROJECT_ID);
      if (!adminUuid) {
        console.warn('[Admin] Could not extract Admin UUID from PROJECT_ID; skipping reporting');
        return;
      }

      // Create a structural adapter for the admin reporter
      // (no runtime dependency on full BasicClient)
      const reportingClient: ReportingClient = {
        subscribe: (listener: () => void) => client.subscribe(listener),
        getSnapshot: () => {
          const state = client.getSnapshot();
          return {
            isReady: state.isReady,
            authStatus: state.authStatus,
            isAnonymous: state.isAnonymous,
            did: state.did,
          };
        },
      };

      // Start the reporter with activity reporting enabled
      activeReporter = startAdminUserReporting({
        client: reportingClient,
        projectId: adminUuid,
        adminUrl: import.meta.env.VITE_ADMIN_URL || 'https://api.basic.tech',
        activity: true, // Enable daily active user reporting
      });

      console.debug('[Admin] User directory and activity reporting started');
    } catch (error) {
      // Never let reporting errors break the app
      console.warn('[Admin] Failed to start reporting (non-critical):', error);
    }

    // Cleanup on unmount
    return () => {
      if (activeReporter) {
        try {
          activeReporter.stop();
          activeReporter = null;
          hasInitialized.current = false;
          console.debug('[Admin] Reporting stopped');
        } catch (error) {
          console.warn('[Admin] Error during reporter cleanup:', error);
        }
      }
    };
  }, [client]);
}
