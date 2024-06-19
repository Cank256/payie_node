/**
 * @fileOverview Constants for commonly used HTTP status codes,
 * log levels, error messages, SMS codes, and notification statuses.
 * @module constants
 */

/**
 * HTTP status codes for API responses.
 * @const {Object}
 * @name STATUS_CODES
 * @memberof module:constants
 */
export const STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    HTTP_GATEWAY_TIMEOUT: 504,
}

/**
 * Log levels for logging purposes.
 * @const {Object}
 * @name LOG_LEVELS
 * @memberof module:constants
 */
export const LOG_LEVELS = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL',
}

/**
 * Common error messages for API responses.
 * @const {Object}
 * @name ERROR_MESSAGES
 * @memberof module:constants
 */
export const ERROR_MESSAGES = {
    NON_UNIQUE_REQUEST: 'Please provide a unique nt_ref.',
    MISSING_API_REF: 'Missing api reference (nt_ref).',
    MISSING_PROVIDER_HEADER: 'Missing provider header.',
    UNKNOWN_SERVICE_PROVIDER: 'Unknown service provider.',
    UNAUTHORIZED_ACCESS: 'Unauthorized API access.',
    RESPONSE_TIMEOUT: 'Timeout, response took so long.',
    ROUTE_NOT_FOUND: 'Route not found.',
}

/**
 * Status codes for SMS delivery statuses.
 * @const {Object}
 * @name SMS_CODES
 * @memberof module:constants
 */
export const SMS_CODES = {
    DELIVERED: 1,
    SUBMITTED: 4,
    QUEUED: 8,
}

/**
 * Statuses for categorizing the state of notfications.
 * @const {Object}
 * @name TRANS_STATUS
 * @memberof module:constants
 */
export const NOTIFICATION_STATUS = {
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    PENDING: 'PENDING',
    LOGGED: 'LOGGED',
    SUCCESSFUL: 'SUCCESS',
}
