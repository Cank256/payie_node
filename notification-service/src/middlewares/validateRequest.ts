import { ERROR_MESSAGES, LOG_LEVELS, STATUS_CODES } from '../utils/constants'
import {
    createResponse,
    getServiceProvider,
    insertNotificationLog,
    notificationExists,
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
    let serviceRef = req.serviceRef
    let ntRef = req.body.nt_ref || req.query.nt_ref
    let theService = req.get('service')

    if (!ntRef) {
        let response = createResponse(
            STATUS_CODES.BAD_REQUEST,
            {
                service_ref: serviceRef,
            },
            ERROR_MESSAGES.MISSING_API_REF,
        )
        await insertNotificationLog(
            req,
            LOG_LEVELS.INFO,
            ERROR_MESSAGES.MISSING_API_REF,
            response,
        )
        return res.status(response.code).json(response)
    }

    if (await notificationExists(ntRef)) {
        let response = createResponse(
            STATUS_CODES.BAD_REQUEST,
            {
                service_ref: serviceRef,
                nt_ref: ntRef,
            },
            ERROR_MESSAGES.NON_UNIQUE_REQUEST,
        )
        await insertNotificationLog(
            req,
            LOG_LEVELS.INFO,
            ERROR_MESSAGES.NON_UNIQUE_REQUEST,
            response,
        )
        return res.status(response.code).json(response)
    }

    //validate service provider
    if (!theService) {
        let response = createResponse(
            STATUS_CODES.BAD_REQUEST,
            {
                service_ref: serviceRef,
                nt_ref: ntRef,
            },
            ERROR_MESSAGES.MISSING_PROVIDER_HEADER,
        )
        await insertNotificationLog(
            req,
            LOG_LEVELS.INFO,
            ERROR_MESSAGES.MISSING_PROVIDER_HEADER,
            response,
        )
        return res.status(response.code).json(response)
    }

    if (!config.get(`service_providers:${theService}`)) {
        let response = createResponse(
            STATUS_CODES.BAD_REQUEST,
            {
                service_ref: serviceRef,
                nt_ref: ntRef,
            },
            ERROR_MESSAGES.UNKNOWN_SERVICE_PROVIDER,
        )
        await insertNotificationLog(
            req,
            LOG_LEVELS.INFO,
            ERROR_MESSAGES.UNKNOWN_SERVICE_PROVIDER,
            response,
        )
        return res.status(response.code).json(response)
    }
    //Add service provider to request
    req.serviceProvider = await getServiceProvider(theService)

    //call next middleware
    next()
}
