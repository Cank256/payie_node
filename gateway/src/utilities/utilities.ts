/**
 * @fileOverview Module for creating and handling API responses.
 * @module utils/response
 * @requires constants
 */

import { STATUS_CODES } from "./constants";

/**
 * Interface representing a standardized API response.
 * @interface
 * @name IResponse
 * @property {boolean} success - Indicates the success status of the request.
 * @property {number} code - HTTP status code of the response.
 * @property {string} message - Descriptive message associated with the response.
 * @property {any} [data] - Optional data payload included in the response.
 */
export interface IResponse {
    success: boolean,
    code: number,
    message: string,
    data?: any
}

/**
 * Creates a standardized API response object.
 * @function
 * @name createResponse
 * @param {number} code - HTTP status code of the response.
 * @param {any} [data] - Optional data payload included in the response.
 * @param {string} [extraInfo=""] - Additional information to be appended to the response message.
 * @returns {IResponse} - Standardized API response object.
 * @memberof module:utils/response
 */
export function createResponse(code: number, data?: any, extraInfo: string = ""): IResponse {
    return {
        code,
        success: code < 300 ? true : false,
        message: getStatusCodeMessage(code, extraInfo),
        data
    };
}

/**
 * Retrieves a descriptive message corresponding to the HTTP status code.
 * @function
 * @name getStatusCodeMessage
 * @param {number} code - HTTP status code.
 * @param {string} extraInfo - Additional information to be appended to the response message.
 * @returns {string} - Descriptive message associated with the status code.
 * @memberof module:utils/response
 */
export function getStatusCodeMessage(code: number, extraInfo: string): string {
    switch (code) {
        case STATUS_CODES.OK:
            return `Request completed successfully. ${extraInfo}`.trim();
        case STATUS_CODES.SERVICE_UNAVAILABLE:
            return `Service is unavailable. ${extraInfo}`.trim();
        case STATUS_CODES.BAD_REQUEST:
            return `Invalid request. ${extraInfo}`.trim();
        case STATUS_CODES.HTTP_GATEWAY_TIMEOUT:
        case STATUS_CODES.INTERNAL_SERVER_ERROR:
            return `Encountered an unexpected condition. ${extraInfo}`.trim();
        case STATUS_CODES.UNPROCESSABLE_ENTITY:
            return `Request Failed. ${extraInfo}`.trim();
        case STATUS_CODES.NOT_FOUND:
            return `Request Failed. ${extraInfo}`.trim();
        default:
            return `Unknown status code: ${code}. ${extraInfo}`.trim();
    }
}
