/**
 * @fileOverview Routes for the Payie Gateway API version 1 Routes.
 * @module routes/v1_routes
 */

'use strict'

import express = require('express')
let router = express.Router()
const redisClient = require('../config/redis')

import { LOG_LEVELS, STATUS_CODES } from '../utils/constants'
import {
    createResponse,
    getServiceProviders,
    insertTransactionLog,
    updateTransactionLog,
} from '../utils/utilities'
import {
    authenticateRequest,
    getRequestDetails,
    validateRequest,
} from '../middlewares'
import { Service } from '../services/service'

/**
 * Redis Cache key prefix for API routes.
 * @const {string}
 */
const CACHE_KEY = 'payie_gateway_v1-'

/**
 * Time to live (TTL) for redis cached data in seconds.
 * @const {number}
 */
const CACHE_TTL = 60 * 60

router.get('/', (req: any, res, next) => {
    res.json({
        code: STATUS_CODES.OK,
        success: true,
        message: 'CankPay Gateway v1',
    })
})

/**
 * Route handler for the providers endpoint.
 * Retrieves and caches the API state.
 *
 * @function
 * @name GET/providers
 * @memberof module:routes/v1_routes
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response containing the API state.
 * @throws {Error} - Throws an error if there's an issue with Redis operations.
 */
router.get(
    '/providers',
    authenticateRequest,
    validateRequest,
    getRequestDetails,
    async (req, res, next) => {
        try {
            let response = getServiceProviders()

            // Attempt to retrieve cached data from Redis
            const getCached = await redisClient.get(CACHE_KEY + 'providers')

            // Check if cached data exists and is different from the response
            if (
                getCached.status === true &&
                JSON.parse(getCached.data) !== response
            ) {
                // Update the cached data with the new response
                const setCached = await redisClient.set(
                    CACHE_KEY + 'providers',
                    JSON.stringify(response),
                    CACHE_TTL,
                )

                // Check if caching is successful
                if (setCached.status) {
                    return res.status(STATUS_CODES.OK).json(response)
                }
            }

            // Return the cached data or the response if caching fails
            return res.status(STATUS_CODES.OK).json(JSON.parse(getCached.data))
        } catch (err) {
            // Handle Redis errors
            console.error(err)
            let theError = createResponse(
                STATUS_CODES.INTERNAL_SERVER_ERROR,
                {},
                'Internal Server Error',
            )
            return res.status(STATUS_CODES.OK).json(theError)
        }
    },
)

/**
 * Handles a POST request to validate an account, following a series of middleware operations.
 * @function
 * @name POST/validate-account
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise resolving to a JSON response sent to the client.
 */
router.post(
    '/validate-account',
    authenticateRequest,
    validateRequest,
    getRequestDetails,
    async function (req: any, res, next) {
        try {
            // Extract the service provider instance from the request
            let serviceProvider: Service = req.serviceProvider

            // Insert transaction log with INFO level
            await insertTransactionLog(req, LOG_LEVELS.INFO)

            // Validate the account using the service provider's specific method
            let response = await serviceProvider.validateAccount(req)

            // Update transaction log with the validation response
            await updateTransactionLog(req, response)

            // If the response is not sent yet, send the JSON response to the client
            if (!res.headersSent) {
                res.status(response.code).json(response)
            }
        } catch (error) {
            // Handle any unexpected errors and send a 500 Internal Server Error response
            console.error(error)
            let errorResponse = createResponse(
                STATUS_CODES.INTERNAL_SERVER_ERROR,
                {},
                'Internal Server Error',
            )
            res.status(errorResponse.code).json(errorResponse)
        }
    },
)

/**
 * Handle POST requests to '/collect'.
 * Initiates a collection transaction using the configured service provider.
 * @name POST/collect
 * @function
 * @memberof collectRouter
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - The response is sent to the client.
 * @throws {Error} - Throws an error if the transaction log update fails.
 */
router.post(
    '/collect',
    authenticateRequest,
    validateRequest,
    getRequestDetails,
    async function (req: any, res, next) {
        let serviceProvider: Service = req.serviceProvider

        // Log the initiation of the collection transaction.
        await insertTransactionLog(req, LOG_LEVELS.INFO)

        // Check if the service provider requires a callback for this transaction.
        if (serviceProvider.requestWithCallback()) {
            // Initiate the collection transaction with callback.
            await serviceProvider.collect(req, async function (response) {
                // Update the transaction log with the response.
                await updateTransactionLog(req, response)

                // Send the response to the client if the headers are not sent.
                if (!res.headersSent) {
                    res.status(response.code).json(response)
                }
            })
        } else {
            // Initiate the collection transaction without callback.
            let response = await serviceProvider.collect(req)

            // Update the transaction log with the response.
            await updateTransactionLog(req, response)

            // Send the response to the client if the headers are not sent.
            if (!res.headersSent) {
                res.status(response.code).json(response)
            }
        }
    },

    /**
     * Handle POST requests to '/transfer'.
     * Initiates a money transfer transaction using the configured service provider.
     * This route uses different middleware to authenticate the request, validate it, and
     * obtain necessary details before processing the transfer.
     * Depending on the service provider's configuration, the transfer might require a callback.
     * 
     * @name POST/transfer
     * @function
     * @memberof transferRouter
     * @async
     * @param {Object} req - The request object, containing transfer details and service provider information.
     * @param {Object} res - The response object used to send back the transfer status.
     * @param {function} next - The next middleware function in the stack.
     * @returns {Promise<void>} - The response is sent to the client indicating the transfer result.
     * @throws {Error} - Throws an error if the transaction log update fails or if an issue occurs during the transfer process.
     */
    router.post('/transfer', authenticateRequest, validateRequest, getRequestDetails, async function (req: any, res, next) {
        // Extracts the ServiceProvider instance from the request.
        let serviceProvider: Service = req.serviceProvider;

        // Inserts a transaction log with an INFO level for monitoring purposes.
        await insertTransactionLog(req, LOG_LEVELS.INFO);

        // Checks if the ServiceProvider requires a callback for payout transactions.
        if (serviceProvider.requestWithPayoutCallback()) {
            // Performs the transfer with a callback, handling the transaction asynchronously.
            await serviceProvider.transfer(req, async function (response) {
                // Updates the transaction log with the outcome of the transfer.
                await updateTransactionLog(req, response);

                // Sends the transfer response to the client, provided no headers have been sent already.
                if (!res.headersSent) {
                    res.status(response.code).json(response);
                }
            });
        } else {
            // Performs the transfer synchronously without a callback.
            let response = await serviceProvider.transfer(req);

            // Updates the transaction log with the outcome of the transfer.
            await updateTransactionLog(req, response);

            // Sends the transfer response to the client, provided no headers have been sent already.
            if (!res.headersSent) {
                res.status(response.code).json(response);
            }
        }
    }),

    /**
     * Handle POST requests to '/check-transaction-status'.
     * This route initiates a transaction status check using the configured service provider.
     * It supports both synchronous and asynchronous handling of the transaction status check,
     * based on the service provider's capabilities.
     * 
     * @name POST/check-transaction-status
     * @function
     * @memberof transactionStatusRouter
     * @async
     * @param {Object} req - The request object, containing transaction details and service provider information.
     * @param {Object} res - The response object used to send back the transaction status.
     * @param {function} next - The next middleware function in the stack.
     * @returns {Promise<void>} - The response is sent to the client indicating the transaction status.
     * @throws {Error} - Throws an error if the transaction log update fails or if an issue occurs during the status check process.
     */
    router.get('/transaction/status', authenticateRequest, validateRequest, getRequestDetails, async function (req: any, res, next) {
        // Extracts the ServiceProvider instance from the request.
        let serviceProvider: Service = req.serviceProvider;

        // Inserts a transaction log with an INFO level for monitoring purposes.
        await insertTransactionLog(req, LOG_LEVELS.INFO);

        // Checks if the ServiceProvider requires a callback for transaction status check.
        if (serviceProvider.requestWithCallback()) {
            // Performs the transaction status check with a callback, handling it asynchronously.
            await serviceProvider.checkTransactionStatus(req, async function (response) {
                // Updates the transaction log with the outcome of the status check.
                await updateTransactionLog(req, response);

                // Sends the transaction status response to the client, provided no headers have been sent already.
                if (!res.headersSent) {
                    res.status(response.code).json(response);
                }
            });
        } else {
            // Performs the transaction status check synchronously without a callback.
            let response = await serviceProvider.checkTransactionStatus(req);

            // Updates the transaction log with the outcome of the status check.
            await updateTransactionLog(req, response);

            // Sends the transaction status response to the client, provided no headers have been sent already.
            if (!res.headersSent) {
                res.status(response.code).json(response);
            }
        }
    }),



)

module.exports = router
