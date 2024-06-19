import { STATUS_CODES } from '../utils/constants'
import { createResponse } from '../utils/utilities'

/**
 * Middleware to validate the content type of incoming requests.
 * @function
 * @name getRequestData
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Object} - JSON response object indicating success or failure.
 * @memberof module:utils/response
 */
export async function getRequestData(req, res, next) {
    if (!req.is('*/json')) {
        let response = createResponse(
            STATUS_CODES.BAD_REQUEST,
            {},
            'Unrecognized Request Content Type',
        )
        return res.status(response.code).json(response)
    } else {
        next()
    }
}

/**
 * Middleware to extract and clean up details from incoming requests.
 * @function
 * @name getRequestDetails
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {void}
 * @memberof module:utils/response
 */
export function getRequestDetails(req, res, next) {
    let details = {}
    let ntRef = req.body.nt_ref || req.query.nt_ref
    let data = req.body.data
    let provider = req.body.provider
    let to = req.body.to
    let from = req.body.from
    let subject = req.body.subject
    let message = req.body.message

    details = {
        ntRef,
        data,
        provider,
        to,
        from,
        subject,
        message,
    }

    /*clean up to remove all the null or undefined parameters*/
    Object.keys(details).forEach(
        (key) =>
            (details[key] == null || details[key] == undefined) &&
            delete details[key],
    )
    req.details = details
    next()
}
