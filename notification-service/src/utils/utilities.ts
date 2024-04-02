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
 * @property {string} [encryption] - Encryption protocol for the service provider.
 * @property {string} [user_name] - Username for authentication with the service provider.
 * @property {string} [password] - Password for authentication with the service provider.
 * @property {string} [mailer] - Callback URL for the service provider.
 * @property {string} [host] - Host URL for the service provider.
 * @property {string} [port] - Port for the service provider.
 * @property {string} [secure] - Security option for the service provider.
 */
export interface IConfig {
    name?: string
    type?: string[]
    code?: string
    server_url?: string
    secret_key?: string
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
    provider_callback_url?: string
    encryption: String
    user_name: String
    password: String
    mailer: String
    host:String
    port: String
    secure: String
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
        success: code < 300,
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

export function handleMissingParameters(details: any, params: string[], callback: Function, gatewayRef: string, pyRef: string) {
    for (const param of params) {
        if (!details[param]) {
            // If the parameter is missing, return a callback with the appropriate error message.
            return callback(createResponse(
                STATUS_CODES.BAD_REQUEST,
                { gateway_ref: gatewayRef, py_ref: pyRef },
                `Missing ${param}.`
            ));
        }
    }
} 

/**
 * Inserts a notification log into the database.
 * @function
 * @name insertTransactionLog
 * @param {Object} req - The request object.
 * @param {string} level - Log level.
 * @param {string} [message] - Log message.
 * @param {IResponse} [response] - API response associated with the transaction.
 * @returns {Promise<any>} - Promise that resolves when the notification log is inserted.
 * @memberof module:utils/response
 */
export async function insertNotificationLog(
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
            .collection(process.env.DB_notifications_COLLECTION)
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
export async function notificationExists(pyRef: string) {
    let count = await db
        .get()
        .collection(process.env.DB_notifications_COLLECTION)
        .count({ 'requestBody.py_ref': pyRef })
    return count > 0
}

/**
 * Updates the notification log with the provided response.
 * @function
 * @name updateNotificationLog
 * @param {Object} req - The request object.
 * @param {IResponse} response - API response to be updated in the notification log.
 * @returns {Promise<any>} - Promise that resolves when the notification log is updated.
 * @memberof module:utils/response
 */
export async function updateNotificationLog(req: any, response: IResponse) {
    let gatewayRef = req.gatewayRef
    try {
        let collection = db
            .get()
            .collection(process.env.DB_NOTIFICATIONS_COLLECTION)
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
 * Updates the notification log with the provided response based on the external reference.
 * @function
 * @name updateLogByExternalRef
 * @param {string} pyRef - External reference ID.
 * @param {IResponse} response - API response to be updated in the notification log.
 * @returns {Promise<any>} - Promise that resolves when the notification log is updated.
 * @memberof module:utils/response
 */
export async function updateLogByExternalRef(
    pyRef: string,
    response: IResponse,
) {
    /*this function updates the notification log where the pyRef is the given value*/
    try {
        let collection = db
            .get()
            .collection(process.env.DB_NOTIFICATIONS_COLLECTION)
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

/**
 * Asynchronously finds notifications in a given collection based on search criteria.
 * This function searches the MongoDB collection and returns an array of matching notifications.
 * If no notifications match the criteria, it returns an empty array.
 *
 * @async
 * @function findNotification
 * @param {Collection} collection - The MongoDB collection to search in.
 * @param {Object} whereSearch - The search criteria used to find notifications.
 * @returns {Promise<any>} - A promise that resolves to an array of found notifications.
 * @throws {Error} - Logs an error message to the console if the search operation fails.
 */
export async function findNotification(collection, whereSearch): Promise<any> {
    try {
        // Performing the search in the provided collection using the given criteria.
        let getNotification = await collection.find(whereSearch).toArray()

        // Resolves with an array of found notifications.
        return await Promise.all(getNotification)
    } catch (err) {
        // Logging the error message to the console if the search operation fails.
        console.log(err.message)
    }
}

/**
 * Find documents in a MongoDB collection with optional pagination.
 *
 * @param {Collection} collection - The MongoDB collection to query.
 * @param {Object} whereSearch - The search criteria for filtering documents.
 * @param {number} skip - The number of documents to skip (for pagination).
 * @param {number} size - The maximum number of documents to retrieve.
 * @returns {Promise<Array>} - A Promise that resolves to an array containing retrieved documents and total document count.
 */
export async function findDocuments(
    collection,
    whereSearch,
    skip: number,
    size: number,
): Promise<any> {
    try {
        // Count the total number of documents that match the search criteria
        let getDocsCount = await collection.countDocuments(whereSearch)

        // Retrieve documents based on the search criteria, sorting by '_id' in descending order
        // Skip a certain number of documents for pagination and limit the number of retrieved documents
        let getDocs = await collection
            .find(whereSearch)
            .sort([['_id', -1]])
            .skip(skip)
            .limit(size)
            .toArray()

        // Return an array containing retrieved documents and total document count
        return await Promise.all([getDocs, getDocsCount])
    } catch (err) {
        console.log(err.message) // Log any errors to the console
    }
}
