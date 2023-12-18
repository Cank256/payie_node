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

module.exports = router
