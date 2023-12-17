export const STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    HTTP_GATEWAY_TIMEOUT: 504
};

export const LOG_LEVELS = {
    DEBUG: "DEBUG",
    INFO: "INFO",
    WARNING: "WARNING",
    ERROR: "ERROR",
    CRITICAL: "CRITICAL"
};

export const ERROR_MESSAGES = {
    NON_UNIQUE_TRANSACTION: 'Transaction already exists. Please provide a unique gateway transaction id.',
    MISSING_TRANSACTION_ID: 'Missing gateway transaction id.',
    MISSING_PROVIDER_HEADER: 'Missing provider header.',
    UNKNOWN_SERVICE_PROVIDER: 'Unknown service provider.',
    UNAUTHORIZED_ACCESS: 'Unauthorized API access.',
    RESPONSE_TIMEOUT: 'Timeout, response took so long.',
    ROUTE_NOT_FOUND: 'Route not found.',
};

export const SMS_CODES = {
    DELIVERED: 1,
    SUBMITTED: 4,
    QUEUED: 8
};

export const TRANS_TYPES = {
    COLLECTION: "collection",
    PAYOUT: "payout",
    PURCHASE: "purchase",
    VALIDATION: "validation"
};

export const TRANS_STATUS = {
    CANCELLED: "CANCELLED",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    PENDING: "PENDING",
    LOGGED: "LOGGED",
    SUCCESSFUL: "SUCCESS"
};