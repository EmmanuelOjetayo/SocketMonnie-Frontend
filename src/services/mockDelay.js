/** Simulates network latency for mock-mode service calls. */
export const mockDelay = (data, ms = 350) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

/**
 * Global mock switch. Flip to false once the real backend endpoints
 * documented in each service file are live — no page code changes needed.
 */
export const USE_MOCK = false;