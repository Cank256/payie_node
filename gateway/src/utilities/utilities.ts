/**
 * @fileOverview Module for creating and handling API responses.
 * @module utils/response
 * @requires constants
 */

require('dotenv').config()
const dasherize = require('underscore.string/dasherize')
const uniqid = require('uniqid')
import { ERROR_MESSAGES, LOG_LEVELS, STATUS_CODES } from './constants'
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
 * @property {string} [request_payment_url] - URL for requesting payments from the service provider.
 * @property {string} [payout_url] - URL for processing payouts with the service provider.
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
 * @property {string} [collection_subscription_key] - Subscription key for collection events.
 * @property {string} [payout_subscription_key] - Subscription key for payout events.
 * @property {string} [provider_callback_url] - Callback URL for the service provider.
 */
export interface IConfig {
    name?: string
    type?: string[]
    code?: string
    server_url?: string
    secret_key?: string
    request_payment_url?: string
    payout_url?: string
    auth_url?: string
    validate_url?: string
    send_sms_url?: string
    balance_url?: string
    secret?: string
    msisdn?: string
    client_id?: string
    api_key?: string
    api_user?: string
    allowed_callback_ips?: string[]
    collection_subscription_key?: string
    payout_subscription_key?: string
    provider_callback_url?: string
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
        success: code < 300 ? true : false,
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
            ERROR_MESSAGES.MISSING_TRANSACTION_ID,
        )
        await insertTransactionLog(
            req,
            LOG_LEVELS.INFO,
            ERROR_MESSAGES.MISSING_TRANSACTION_ID,
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

export async function getServiceProvider(code: string): Promise<any> {
    let providerConfig = config.get(`service_providers:${code}`)
    let serviceProvider = await import(`./services/${dasherize(code)}`)
    return new serviceProvider.default(providerConfig)
}

/*use this to generate transaction IDs*/
export function generateCode(): string {
    let code = new Date().getTime() + Math.floor(Math.random() * 100000000)
    return code.toString()
}

export function generateUniqueId(): string {
    return uniqid('cankpay-')
}

export async function insertTransactionLog(
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
            .collection(config.get('db:collections:transactions'))
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

export async function transactionExists(pyRef: string) {
    let count = await db
        .get()
        .collection(config.get('db:collections:transactions'))
        .count({ 'requestBody.py_ref': pyRef })
    return count > 0
}


export async function updateTransactionLog(req: any, response: IResponse) {
    let gatewayRef = req.gatewayRef;
    try {
        let collection = db.get().collection(config.get('db:collections:transactions'));
        return await collection.updateOne({gatewayRef: gatewayRef}, {
            $set: {
                responseBody: response,
                updatedAt: new Date()
            }
        });
    } catch (err) {
        console.log(err.message);
    }
}

export async function updateLogByExternalRef(pyRef: string, response: IResponse) {
    /*this function updates the transaction log where the pyRef is the given value*/
    try {
        let collection = db.get().collection(config.get('db:collections:transactions'));
        return await collection.updateOne({"requestBody.py_ref": pyRef}, {
            $set: {
                responseBody: response,
                updatedAt: new Date()
            }
        });
    } catch (err) {
        console.log(err.message);
    }
}

export function getRequestDetails(req, res, next) {
    let details = {}
    let pyRef = req.body.py_ref || req.query.py_ref
    let data = req.body.data
    let amount = req.body.amount
    let msisdn = req.body.msisdn

    /*some of the parameters used by PayWay*/
    let provider = req.body.provider
    let contactPhone = req.body.contact_phone
    let code = req.body.product_code || req.query.product_code
    let bundleType = req.body.bundle_type
    let secondaryCode = req.body.secondary_product_code
    let ip12 = req.body.ip12
    let period = req.body.period
    let areaId = req.body.area_id
    let scenarioId = req.body.scenario_id
    let itemsId = req.body.items_id
    let quantity = req.body.quantity
    let marketsId = req.body.markets_id
    let prn = req.body.prn
    let branchId = req.body.branch_id
    let penaltyType = req.body.penalty_type
    let penaltyId = req.body.penalty_id
    let payerName = req.body.payer_name
    let uraRef = req.body.ura_ref
    let uraPlate = req.body.ura_plate
    let uraPermit = req.body.ura_permit
    let memo = req.body.memo
    let listId = req.body.list_id || req.query.list_id
    let currency = req.body.currency
    let version = req.body.version
    let visaDetails = req.body.visa_details
    let smsFrom = req.body.sms_from
    let smsTo = req.body.sms_to
    let smsText = req.body.sms_text
    let retry = req.body.retry
    let reference = req.body.reference
    let networkId = req.body.network_id
    let debtorName = req.body.debtor_name
    let redirect_url = req.body.redirect_url
    let transaction_id = req.body.transaction_id
    let status = req.body.status
    let client_name = req.body.client_name
    let client_email = req.body.client_email
    let tx_ref = req.body.tx_ref

    // Variables for FlutterWave Webbhook
    let id = req.body.id
    let txRef = req.body.txRef
    let flwRef = req.body.flwRef
    let orderRef = req.body.orderRef
    let paymentPlan = req.body.paymentPlan
    let createdAt = req.body.createdAt
    let charged_amount = req.body.charged_amount
    let IP = req.body.IP
    let customer = req.body.customer
    let entity = req.body.entity

    details = {
        pyRef,
        amount,
        msisdn,
        provider,
        contactPhone,
        code,
        bundleType,
        secondaryCode,
        ip12,
        period,
        areaId,
        scenarioId,
        itemsId,
        quantity,
        marketsId,
        prn,
        branchId,
        penaltyType,
        penaltyId,
        payerName,
        uraRef,
        uraPlate,
        uraPermit,
        memo,
        listId,
        currency,
        version,
        visaDetails,
        smsFrom,
        smsTo,
        smsText,
        retry,
        reference,
        networkId,
        debtorName,
        redirect_url,
        transaction_id,
        tx_ref,
        status,
        client_name,
        client_email,
        txRef,
        id,
        flwRef,
        orderRef,
        paymentPlan,
        createdAt,
        charged_amount,
        IP,
        customer,
        entity,
        data,
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
