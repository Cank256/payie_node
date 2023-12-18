import { ERROR_MESSAGES, LOG_LEVELS, STATUS_CODES } from "../utils/constants";
import { createResponse, insertTransactionLog } from "../utils/utilities";


/**
 * Middleware to authenticate incoming requests based on API key and IP address.
 * @function
 * @name authenticateRequest
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {void}
 * @memberof module:utils/response
 */
export async function authenticateRequest(req, res, next) {
    let gatewayRef = req.gatewayRef;
    const authorizedIPs = JSON.parse(process.env.APP_AUTHORIZED_IPS || '[]');
    
    if (req.get('api-key') !== process.env.APP_API_KEY || !authorizedIPs.includes(req.ip)) {
        let response = createResponse(STATUS_CODES.BAD_REQUEST, {transaction_id: gatewayRef}, ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
        await insertTransactionLog(req, LOG_LEVELS.CRITICAL, ERROR_MESSAGES.UNAUTHORIZED_ACCESS, response);
        return res.status(response.code).json(response);
    }
    next();
}