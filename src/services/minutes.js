import { apiClient } from "./apiClient";

/**
 * Initialize monthly SocketMinutes contribution.
 *
 * POST /api/payment/minutes/initialize
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     publicKey,
 *     reference,
 *     totalPayable,
 *     currency,
 *     customer,
 *     metadata
 *   }
 * }
 */