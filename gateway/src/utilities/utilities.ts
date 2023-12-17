/**
 * @fileOverview Module for creating and handling API responses.
 * @module utils/response
 * @requires constants
 */

import { STATUS_CODES } from "./constants";
let config = require('../config/providers');

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
    success: boolean,
    code: number,
    message: string,
    data?: any
}

export interface IConfig {
    name?: string,
    type?: string[],
    code?: string,
    server_url?: string,
    secret_key?: string,
    request_payment_url?: string,
    payout_url?: string,
    auth_url?: string,
    validate_url?: string,
    send_sms_url?: string,
    balance_url?: string,
    secret?: string,
    msisdn?: string,
    client_id?: string,
    api_key?: string,
    api_user?: string,
    allowed_callback_ips?: string[],
    collection_subscription_key?: string,
    payout_subscription_key?: string,
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
export function createResponse(code: number, data?: any, extraInfo: string = ""): IResponse {
    return {
        code,
        success: code < 300 ? true : false,
        message: getStatusCodeMessage(code, extraInfo),
        data
    };
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
            return `Request completed successfully. ${extraInfo}`.trim();
        case STATUS_CODES.SERVICE_UNAVAILABLE:
            return `Service is unavailable. ${extraInfo}`.trim();
        case STATUS_CODES.BAD_REQUEST:
            return `Invalid request. ${extraInfo}`.trim();
        case STATUS_CODES.HTTP_GATEWAY_TIMEOUT:
        case STATUS_CODES.INTERNAL_SERVER_ERROR:
            return `Encountered an unexpected condition. ${extraInfo}`.trim();
        case STATUS_CODES.UNPROCESSABLE_ENTITY:
            return `Request Failed. ${extraInfo}`.trim();
        case STATUS_CODES.NOT_FOUND:
            return `Request Failed. ${extraInfo}`.trim();
        default:
            return `Unknown status code: ${code}. ${extraInfo}`.trim();
    }
}

export function getServiceProviders(): IResponse {
    let providers = [];
    let providersList = config.get('service_providers');

    for (let key in providersList) {
        if (providersList.hasOwnProperty(key) && providersList[key]["name"]) {
            providers.push({
                name: providersList[key]["name"],
                code: providersList[key]["code"],
                type: providersList[key]["type"]
            });
        }

    }

    return createResponse(STATUS_CODES.OK, providers);
}

export function getRequestDetails(req, res, next) {
    let details = {};
    let externalTransactionId = req.body.external_transaction_id || req.query.external_transaction_id;
    let data = req.body.data;
    let amount = req.body.amount;
    let msisdn = req.body.msisdn;

    /*some of the parameters used by PayWay*/
    let provider = req.body.provider;
    let contactPhone = req.body.contact_phone;
    let code = req.body.product_code || req.query.product_code;
    let bundleType = req.body.bundle_type;
    let secondaryCode = req.body.secondary_product_code;
    let ip12 = req.body.ip12;
    let period = req.body.period;
    let areaId = req.body.area_id;
    let scenarioId = req.body.scenario_id;
    let itemsId = req.body.items_id;
    let quantity = req.body.quantity;
    let marketsId = req.body.markets_id;
    let prn = req.body.prn;
    let branchId = req.body.branch_id;
    let penaltyType = req.body.penalty_type;
    let penaltyId = req.body.penalty_id;
    let payerName = req.body.payer_name;
    let uraRef = req.body.ura_ref;
    let uraPlate = req.body.ura_plate;
    let uraPermit = req.body.ura_permit;
    let memo = req.body.memo;
    let listId = req.body.list_id || req.query.list_id;
    let currency = req.body.currency;
    let version = req.body.version;
    let visaDetails = req.body.visa_details;
    let smsFrom = req.body.sms_from;
    let smsTo = req.body.sms_to;
    let smsText = req.body.sms_text;
    let retry = req.body.retry;
    let reference = req.body.reference;
    let networkId = req.body.network_id;
    let debtorName = req.body.debtor_name;
    let redirect_url = req.body.redirect_url;
    let transaction_id = req.body.transaction_id;
    let status = req.body.status;
    let client_name = req.body.client_name;
    let client_email = req.body.client_email;
    let tx_ref = req.body.tx_ref;
    
    // Variables for FlutterWave Webbhook
    let id = req.body.id;
    let txRef = req.body.txRef;
    let flwRef = req.body.flwRef;
    let orderRef = req.body.orderRef;
    let paymentPlan = req.body.paymentPlan;
    let createdAt = req.body.createdAt;
    let charged_amount = req.body.charged_amount;
    let IP = req.body.IP;
    let customer = req.body.customer;
    let entity = req.body.entity;

    details = {
        externalTransactionId,
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
    };

    /*clean up to remove all the null or undefined parameters*/
    Object.keys(details).forEach((key) => (details[key] == null || details[key] == undefined) && delete details[key]);
    req.details = details;
    next();
}
