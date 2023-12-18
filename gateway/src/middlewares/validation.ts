import { ERROR_MESSAGES, LOG_LEVELS, STATUS_CODES } from '../utils/constants'
import {
    createResponse,
    getServiceProvider,
    insertTransactionLog,
    transactionExists,
} from '../utils/utilities'
let config = require('../config/providers')

/**
 * Middleware to validate and process incoming requests.
 * @function
 * @name validateRequest
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {void}
 * @memberof module:utils/response
 */
export async function validateRequest(req, res, next) {
    let gatewayRef = req.gatewayRef
    //validate external transaction id
    let pyRef = req.body.py_ref || req.query.py_ref
    if (!pyRef) {
        let response = createResponse(
            STATUS_CODES.BAD_REQUEST,
            {
                gateway_ref: gatewayRef,
            },
            ERROR_MESSAGES.MISSING_API_REF,
        )
        await insertTransactionLog(
            req,
            LOG_LEVELS.INFO,
            ERROR_MESSAGES.MISSING_API_REF,
            response,
        )
        return res.status(response.code).json(response)
    }

    if (await transactionExists(pyRef)) {
        let response = createResponse(
            STATUS_CODES.BAD_REQUEST,
            {
                gateway_ref: gatewayRef,
                py_ref: pyRef,
            },
            ERROR_MESSAGES.NON_UNIQUE_TRANSACTION,
        )
        await insertTransactionLog(
            req,
            LOG_LEVELS.INFO,
            ERROR_MESSAGES.NON_UNIQUE_TRANSACTION,
            response,
        )
        return res.status(response.code).json(response)
    }

    //validate service provider
    if (!req.get('service-provider')) {
        let response = createResponse(
            STATUS_CODES.BAD_REQUEST,
            {
                gateway_ref: gatewayRef,
                py_ref: pyRef,
            },
            ERROR_MESSAGES.MISSING_PROVIDER_HEADER,
        )
        await insertTransactionLog(
            req,
            LOG_LEVELS.INFO,
            ERROR_MESSAGES.MISSING_PROVIDER_HEADER,
            response,
        )
        return res.status(response.code).json(response)
    }

    if (!config.get(`service_providers:${req.get('service-provider')}`)) {
        let response = createResponse(
            STATUS_CODES.BAD_REQUEST,
            {
                gateway_ref: gatewayRef,
                py_ref: pyRef,
            },
            ERROR_MESSAGES.UNKNOWN_SERVICE_PROVIDER,
        )
        await insertTransactionLog(
            req,
            LOG_LEVELS.INFO,
            ERROR_MESSAGES.UNKNOWN_SERVICE_PROVIDER,
            response,
        )
        return res.status(response.code).json(response)
    }
    //Add service provider to request
    req.serviceProvider = await getServiceProvider(req.get('service-provider'))

    //call next middleware
    next()
}
