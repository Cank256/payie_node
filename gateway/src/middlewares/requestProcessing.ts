import { STATUS_CODES } from "../utils/constants"
import { createResponse } from "../utils/utilities"

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
