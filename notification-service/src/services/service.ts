/**
 * @fileOverview Abstract class representing a generic service provider for payment gateway integration.
 * @module services/ServiceProvider
 * @requires utils/utilities
 * @requires utils/constants
 */

import { createResponse, IResponse } from '../utils/utilities'
import { STATUS_CODES } from '../utils/constants'

/**
 * Abstract class representing a generic service provider for payment gateway integration.
 * @abstract
 * @class
 * @name Service
 */
export abstract class Service {
    protected name: string
    protected code: string
    protected type: string[]
    protected msisdn: string
    protected client_id: string
    protected secret_key: string
    protected hostUrl: string
    protected port: number
    protected mailer: string
    protected secure: boolean = false
    protected encryption: string
    protected user_name: string
    protected password: string

    /**
     * Gets the name of the service provider.
     * @function
     * @name getName
     * @returns {string} - Name of the service provider.
     */
    getName(): string {
        return this.name
    }

    /**
     * Gets the type of the service provider.
     * @function
     * @name getType
     * @returns {string[]} - Type of the service provider.
     */
    getType(): string[] {
        return this.type
    }

    /**
     * Checks the balance of the service provider account.
     * @async
     * @function
     * @name checkBalance
     * @param {string} [accountNumber] - Account number for which to check the balance.
     * @returns {Promise<IResponse>} - Standardized API response object.
     */
    async checkBalance(accountNumber?: string): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST)
    }

    /**
     * Validates an account based on the provided request.
     * @async
     * @function
     * @name validateAccount
     * @param {Object} req - The request object.
     * @param {function} [callback] - Callback function for asynchronous handling.
     * @returns {Promise<Object>} - A promise resolving to a standardized API response object.
     */
    async validateAccount(req: any, callback?: any): Promise<IResponse> {
        // Return a standardized response indicating a bad request
        return createResponse(STATUS_CODES.BAD_REQUEST)
    }

    /**
     * Handles notification callback from the service provider.
     * @async
     * @function
     * @name notificationCallback
     * @param {any} req - Request object containing notification details.
     * @returns {Promise<IResponse>} - Standardized API response object.
     */
    async notificationCallback(req: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST)
    }

    /**
     * Sends an SMS using the service provider's SMS service.
     * @async
     * @function
     * @name sendSms
     * @param {any} details - Details of the SMS request.
     * @returns {Promise<IResponse>} - Standardized API response object.
     */
    async sendSms(details: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST)
    }

    /**
     * Sends an Email using the chosen service provider's Email service.
     * @async
     * @function
     * @name sendEmail
     * @param {any} details - Details of the Email request.
     * @returns {Promise<IResponse>} - Standardized API response object.
     */
    async sendEmail(details: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST)
    }

    /**
     * Checks the API status of the service provider.
     * @async
     * @function
     * @name checkApiStatus
     * @param {any} details - Details of the API status request.
     * @param {function} [callback] - Callback function for asynchronous handling.
     * @returns {Promise<IResponse>} - Standardized API response object.
     */
    async checkApiStatus(details: any, callback?: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST)
    }

    /**
     * Checks the notification status with the service provider.
     * @async
     * @function
     * @name checkNotificationtionStatus
     * @param {any} details - Details of the notification status request.
     * @param {function} [callback] - Callback function for asynchronous handling.
     * @returns {Promise<IResponse>} - Standardized API response object.
     */
    async checkNotificationStatus(
        details: any,
        callback?: any,
    ): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST)
    }
}
