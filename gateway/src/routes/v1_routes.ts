/**
 * @fileOverview Routes for the Payie Gateway API version 1 Routes.
 * @module routes/v1_routes
 */

'use strict'

import express = require('express')
let router = express.Router()
const redisClient = require('../config/redis')

import { LOG_LEVELS, STATUS_CODES } from '../utilities/constants'
import {
    authenticateRequest,
    createResponse,
    getRequestDetails,
    getServiceProviders,
    insertTransactionLog,
    validateRequest,
} from '../utilities/utilities'

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
router.get('/providers', authenticateRequest, async (req, res, next) => {
    try {
        let data = getServiceProviders()
        const response = createResponse(STATUS_CODES.OK, data, '')

        // Attempt to retrieve cached data from Redis
        const getCached = await redisClient.get(CACHE_KEY + 'providers')

        // Check if cached data exists
        if (getCached.status === true) {
            return res.status(STATUS_CODES.OK).json(JSON.parse(getCached.data))
        } else {
            // Set the API state in the cache if not found
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
})

module.exports = router
