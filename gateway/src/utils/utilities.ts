/**
 * @fileOverview Module for creating and handling API responses.
 * @module utils/response
 * @requires constants
 */

require('dotenv').config()
const dasherize = require('underscore.string/dasherize')
const uniqid = require('uniqid')
import { STATUS_CODES } from './constants'
let config = require('../config/providers')
const db = require('../config/db')

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
    success: boolean
    code: number
    message: string
    data?: any
}

/**
 * Interface representing configuration details for service providers.
 * @interface
 * @name IConfig
 * @property {string} [name] - Name of the service provider.
 * @property {string[]} [type] - Type of the service provider.
 * @property {string} [code] - Code associated with the service provider.
 * @property {string} [server_url] - URL of the server for the service provider.
 * @property {string} [secret_key] - Secret key for authentication with the service provider.
 * @property {string} [request_payment_url] - URL for requesting payments from the service provider.
 * @property {string} [payout_url] - URL for processing payouts with the service provider.
 * @property {string} [auth_url] - URL for authentication with the service provider.
 * @property {string} [validate_url] - URL for validating requests with the service provider.
 * @property {string} [send_sms_url] - URL for sending SMS messages with the service provider.
 * @property {string} [balance_url] - URL for checking account balance with the service provider.
 * @property {string} [secret] - Secret key for authentication (alternative).
 * @property {string} [msisdn] - Mobile Subscriber Integrated Services Digital Network (MSISDN) for the service provider.
 * @property {string} [client_id] - Client ID for authentication with the service provider.
 * @property {string} [api_key] - API key for authentication with the service provider.
 * @property {string} [api_user] - API user for authentication with the service provider.
 * @property {string[]} [allowed_callback_ips] - List of allowed callback IP addresses for the service provider.
 * @property {string} [collection_subscription_key] - Subscription key for collection events.
 * @property {string} [payout_subscription_key] - Subscription key for payout events.
 * @property {string} [provider_callback_url] - Callback URL for the service provider.
 */
export interface IConfig {
    name?: string
    type?: string[]
    code?: string
    server_url?: string
    secret_key?: string
    request_payment_url?: string
    payout_url?: string
    auth_url?: string
    validate_url?: string
    send_sms_url?: string
    balance_url?: string
    secret?: string
    msisdn?: string
    client_id?: string
    api_key?: string
    api_user?: string
    provider_env?: string
    allowed_callback_ips?: string[]
    collection_subscription_key?: string
    payout_subscription_key?: string
    provider_callback_url?: string
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
export function createResponse(
    code: number,
    data?: any,
    extraInfo: string = '',
): IResponse {
    return {
        code,
        success: code < 300 ? true : false,
        message: getStatusCodeMessage(code, extraInfo),
        data,
    }
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
            return `Request completed successfully. ${extraInfo}`.trim()
        case STATUS_CODES.SERVICE_UNAVAILABLE:
            return `Service is unavailable. ${extraInfo}`.trim()
        case STATUS_CODES.BAD_REQUEST:
            return `Invalid request. ${extraInfo}`.trim()
        case STATUS_CODES.HTTP_GATEWAY_TIMEOUT:
        case STATUS_CODES.INTERNAL_SERVER_ERROR:
            return `Encountered an unexpected condition. ${extraInfo}`.trim()
        case STATUS_CODES.UNPROCESSABLE_ENTITY:
            return `Request Failed. ${extraInfo}`.trim()
        case STATUS_CODES.NOT_FOUND:
            return `Request Failed. ${extraInfo}`.trim()
        default:
            return `Unknown status code: ${code}. ${extraInfo}`.trim()
    }
}

/**
 * Retrieves a list of configured service providers.
 * @function
 * @name getServiceProviders
 * @returns {IResponse} - Standardized API response object containing the list of service providers.
 * @memberof module:utils/response
 */
export function getServiceProviders(): IResponse {
    let providers = []
    let providersList = config.get('service_providers')

    for (let key in providersList) {
        if (providersList.hasOwnProperty(key) && providersList[key]['name']) {
            providers.push({
                name: providersList[key]['name'],
                code: providersList[key]['code'],
                type: providersList[key]['type'],
            })
        }
    }

    return createResponse(STATUS_CODES.OK, providers)
}

/**
 * Retrieves details of a specific service provider based on the provided code.
 * @function
 * @name getServiceProvider
 * @param {string} code - Code of the service provider.
 * @returns {Promise<any>} - Promise that resolves to the service provider details.
 * @memberof module:utils/response
 */
export async function getServiceProvider(code: string): Promise<any> {
    let providerConfig = config.get(`service_providers:${code}`)
    let serviceProvider = await import(`../services/${dasherize(code)}`)
    return new serviceProvider.default(providerConfig)
}

/**
 * Generates a unique transaction ID.
 * @function
 * @name generateCode
 * @returns {string} - Unique transaction ID.
 * @memberof module:utils/response
 */
export function generateCode(): string {
    let code = new Date().getTime() + Math.floor(Math.random() * 100000000)
    return code.toString()
}

/**
 * Generates a unique ID with the specified prefix.
 * @function
 * @name generateUniqueId
 * @returns {string} - Unique ID with the specified prefix.
 * @memberof module:utils/response
 */
export function generateUniqueId(): string {
    return uniqid('cankpay-')
}

/**
 * Inserts a transaction log into the database.
 * @function
 * @name insertTransactionLog
 * @param {Object} req - The request object.
 * @param {string} level - Log level.
 * @param {string} [message] - Log message.
 * @param {IResponse} [response] - API response associated with the transaction.
 * @returns {Promise<any>} - Promise that resolves when the transaction log is inserted.
 * @memberof module:utils/response
 */
export async function insertTransactionLog(
    req: any,
    level: string,
    message?: string,
    response?: IResponse,
) {
    let gatewayRef = req.gatewayRef
    let serviceProvider = req.get('service')
    let requestBody = req.body
    let url = req.originalUrl
    let ipAddress = req.ip

    try {
        let collection = db
            .get()
            .collection(process.env.DB_TRANSACTIONS_COLLECTION)
        return await collection.insertOne({
            ipAddress,
            gatewayRef,
            serviceProvider,
            requestBody,
            url,
            level,
            message,
            responseBody: response,
            createtime: new Date(),
        })
    } catch (err) {
        console.log(err.message)
    }
}

/**
 * Inserts a log entry for messages.
 * @function
 * @name insertMessageLog
 * @param {Object} req - The request object.
 * @param {string} level - The log level.
 * @param {string} message - The log message.
 * @returns {Promise<Object>} - A promise resolving to the result of the log insertion.
 */
export async function insertMessageLog(
    req: any,
    level: string,
    message: string,
) {
    // Extract relevant information from the request object
    let gatewayId = req.gatewayId
    let serviceProvider = req.get('service')
    let requestBody = req.body
    let url = req.originalUrl
    let ipAddress = req.ip

    try {
        // Access the MongoDB collection for message logs
        let collection = db.get().collection(process.env.DB_MESSAGES_COLLECTION)

        // Insert a log entry into the collection
        return await collection.insertOne({
            ipAddress,
            gatewayId,
            serviceProvider,
            requestBody,
            url,
            level,
            message,
            createtime: new Date(),
        })
    } catch (err) {
        // Handle any errors that occur during the log insertion
        console.log(err.message)
    }
}

/**
 * Checks if a transaction with the given external reference exists in the database.
 * @function
 * @name transactionExists
 * @param {string} pyRef - External reference ID.
 * @returns {Promise<boolean>} - Promise that resolves to a boolean indicating whether the transaction exists.
 * @memberof module:utils/response
 */
export async function transactionExists(pyRef: string) {
    let count = await db
        .get()
        .collection(process.env.DB_TRANSACTIONS_COLLECTION)
        .count({ 'requestBody.py_ref': pyRef })
    return count > 0
}

/**
 * Updates the transaction log with the provided response.
 * @function
 * @name updateTransactionLog
 * @param {Object} req - The request object.
 * @param {IResponse} response - API response to be updated in the transaction log.
 * @returns {Promise<any>} - Promise that resolves when the transaction log is updated.
 * @memberof module:utils/response
 */
export async function updateTransactionLog(req: any, response: IResponse) {
    let gatewayRef = req.gatewayRef
    try {
        let collection = db
            .get()
            .collection(process.env.DB_TRANSACTIONS_COLLECTION)
        return await collection.updateOne(
            { gatewayRef: gatewayRef },
            {
                $set: {
                    responseBody: response,
                    updatedAt: new Date(),
                },
            },
        )
    } catch (err) {
        console.log(err.message)
    }
}

/**
 * Updates the transaction log with the provided response based on the external reference.
 * @function
 * @name updateLogByExternalRef
 * @param {string} pyRef - External reference ID.
 * @param {IResponse} response - API response to be updated in the transaction log.
 * @returns {Promise<any>} - Promise that resolves when the transaction log is updated.
 * @memberof module:utils/response
 */
export async function updateLogByExternalRef(
    pyRef: string,
    response: IResponse,
) {
    /*this function updates the transaction log where the pyRef is the given value*/
    try {
        let collection = db
            .get()
            .collection(process.env.DB_TRANSACTIONS_COLLECTION)
        return await collection.updateOne(
            { 'requestBody.py_ref': pyRef },
            {
                $set: {
                    responseBody: response,
                    updatedAt: new Date(),
                },
            },
        )
    } catch (err) {
        console.log(err.message)
    }
}
