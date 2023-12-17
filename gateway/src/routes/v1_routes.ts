/**
 * @fileOverview Routes for the Payie Gateway API version 1 Routes.
 * @module routes/v1_routes
 */

'use strict'

import express = require('express')
let router = express.Router()
const redisClient = require('../config/redis')

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

/**
 * Route handler for the state endpoint.
 * Retrieves and caches the API state.
 *
 * @function
 * @name GET/state
 * @memberof module:routes/v1_routes
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response containing the API state.
 * @throws {Error} - Throws an error if there's an issue with Redis operations.
 */
router.get('/', async (req, res, next) => {
    try {
        // Default API response
        const response = {
            code: 200,
            success: true,
            message: 'CankPay Gateway v1',
        }

        // Attempt to retrieve cached data from Redis
        const getCached = await redisClient.get(CACHE_KEY + 'route')

        // Check if cached data exists
        if (getCached.status === true) {
            return res.status(200).json(JSON.parse(getCached.data))
        } else {
            // Set the API state in the cache if not found
            const setCached = await redisClient.set(
                CACHE_KEY + 'route',
                JSON.stringify(response),
                CACHE_TTL,
            )

            // Check if caching is successful
            if (setCached.status) {
                return res.status(200).json(response)
            }
        }
    } catch (err) {
        // Handle Redis errors
        next(err)
    }
})

module.exports = router
