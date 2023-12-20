/**
 * @fileOverview Express application setup and configuration.
 * @module app
 */

import express = require('express')
import { STATUS_CODES } from './utils/constants'
import { createResponse } from './utils/utilities'
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const timeout = require('express-timeout-handler')
const uniqid = require('uniqid')
let router = require('./config/router')

/**
 * Creates an instance of the Express application.
 * @const {Object}
 */
let app = express()

/**
 * Enable trust in proxy settings.
 * @function
 * @name enableTrustProxy
 * @memberof module:app
 */
app.enable('trust proxy')

/**
 * Middleware for logging HTTP requests to the console.
 * @function
 * @name requestLogger
 * @memberof module:app
 */
app.use(morgan('dev'))

/**
 * Parse incoming JSON requests.
 * @function
 * @name parseJsonRequests
 * @memberof module:app
 */
app.use(bodyParser.json())

/**
 * Parse incoming URL-encoded requests.
 * @function
 * @name parseUrlEncodedRequests
 * @memberof module:app
 */
app.use(bodyParser.urlencoded({ extended: false }))

/**
 * Parse cookies attached to the requests.
 * @function
 * @name parseCookies
 * @memberof module:app
 */
app.use(cookieParser())

/**
 * Configure and apply the timeout handler middleware.
 * @const {Object}
 */
let timeoutOptions = {
    timeout: 480000, // ms == 8 minutes

    /**
     * Custom handler for handling request timeout.
     * @function
     * @name onTimeoutHandler
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     */
    onTimeout: function (req, res) {
        res.status(504)
    },
}

app.use(timeout.handler(timeoutOptions))

/**
 * Middleware function to add a unique identifier to the request object.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Callback function to pass control to the next middleware.
 * @returns {void}
 */
app.use(function (req: any, res, next) {
    // Generate a unique identifier using the uniqid library
    req.gatewayRef = uniqid()

    // Call the next middleware or route handler
    next()
})

/**
 * Configure and apply the routing middleware.
 * @function
 * @name configureRouting
 * @memberof module:app
 * @param {Object} app - The Express application instance.
 */
router(app)

/**
 * Error handling middleware for handling 404 Not Found errors.
 * @function
 * @name notFoundErrorHandler
 * @memberof module:app
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 */
app.use((req, res, next) => {
    const err: any = new Error('Not Found')
    err.status = 404
    next(err)
})

/**
 * Custom error handler middleware.
 * @function
 * @name customErrorHandler
 * @memberof module:app
 * @param {Object} err - The error object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 */
app.use((err, req, res, next) => {
    if (err.status === 404) {
        let response = createResponse(
            STATUS_CODES.NOT_FOUND,
            {},
            'Route Not Found.',
        )
        res.status(STATUS_CODES.NOT_FOUND).json(response)
    } else {
        // Set locals, only providing error in development
        res.locals.message = err.message
        res.locals.error = req.app.get('env') === 'development' ? err : {}

        // Render the error page
        res.status(err.status || 500).render('error')
    }
})

module.exports = app
