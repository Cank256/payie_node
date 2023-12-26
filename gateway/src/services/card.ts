/**
 * @fileOverview Card Class - Manages card transactions, extending from ServiceProvider for shared functionalities.
 * @module services/Card
 * @requires cross-fetch
 * @requires https
 * @requires ../utils/utilities
 * @requires ../utils/constants
 * @requires ./service
 */

import { Service } from './service'
import {
    createResponse,
    generateCode,
    IConfig,
    insertMessageLog,
    IResponse,
} from '../utils/utilities'
import { LOG_LEVELS, STATUS_CODES, TRANS_STATUS } from '../utils/constants'
const db = require('../config/db')

const fetch = require('cross-fetch')
const https = require('https')

// Configuration for the https agent, specifically set to ignore unauthorized certificates.
const agent = new https.Agent({
    rejectUnauthorized: false,
})

/**
 * Class representing the Card service for handling card transactions.
 * Extends ServiceProvider for common service functionalities.
 */
export default class Card extends Service {
    // Class properties declaration
    protected name: string
    protected serverUrl: string
    protected type: string[]
    protected secret_key: string

    /**
     * Constructs an instance of the Card service.
     * @param {IConfig} initConfig - Configuration details for the Card service.
     */
    constructor(initConfig: IConfig) {
        super()
        this.name = initConfig.name
        this.serverUrl = initConfig.server_url
        this.type = initConfig.type
        this.secret_key = initConfig.secret_key
    }

    /**
     * Validates a given account, currently returning a generic bad request.
     * @param {any} details - Account details for validation.
     * @returns {Promise<IResponse>} - The response object.
     */
    async validateAccount(details: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST)
    }

    /**
     * Utility method to remove trailing slash from a URL string.
     * @static
     * @param {string} urlString - The URL string to be processed.
     * @returns {string} - Processed URL string without trailing slash.
     */
    static stripTrailingSlash(urlString: string): string {
        return urlString.endsWith('/') ? urlString.slice(0, -1) : urlString
    }

    /**
     * Handles the collection process for card transactions.
     * @param {any} req - Request object containing transaction details.
     * @returns {Promise<IResponse>} - The response object based on transaction status.
     */
    async collect(req: any): Promise<IResponse> {
        /*get the required parameters*/
        let gatewayRef = req.gatewayRef
        let details = req.details
        let currency = details.currency
        let amount = Number.parseInt(details.amount)
        let pyRef = details.pyRef

        if (!currency) {
            return createResponse(
                STATUS_CODES.BAD_REQUEST,
                {
                    gateway_ref: gatewayRef,
                    py_ref: pyRef,
                },
                'missing currency.',
            )
        }

        if (!amount) {
            return createResponse(
                STATUS_CODES.BAD_REQUEST,
                {
                    gateway_ref: gatewayRef,
                    py_ref: pyRef,
                },
                'missing amount.',
            )
        }

        /*set up the request parameters*/
        // let orderId = generateCode();

        let parameters = {
            tx_ref: gatewayRef,
            amount,
            currency,
            redirect_url: details.redirect_url,
            payment_options: 'card',
            customer: {
                name: details.client_name,
                email: details.client_email,
                phonenumber: details.msisdn,
            },
            customizations: {
                title: 'CankPay',
                description: 'Your Swift Payments',
                logo: '',
            },
        }

        let requestUrl = Card.stripTrailingSlash(this.serverUrl)

        try {
            let response = (await fetch(requestUrl, {
                method: 'POST',
                body: JSON.stringify(parameters),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + this.secret_key,
                },
                agent,
            }).then((k) => k.json())) as any
            if (response.status.toUpperCase() == TRANS_STATUS.SUCCESSFUL) {
                let data = {
                    status: TRANS_STATUS.PENDING,
                    url: response.data.link,
                    gateway_ref: gatewayRef,
                    py_ref: pyRef,
                }
                return createResponse(STATUS_CODES.OK, data)
            } else {
                /*add the transaction IDs to the response*/
                response.gateway_ref = gatewayRef
                response.py_ref = pyRef
                return createResponse(STATUS_CODES.BAD_REQUEST, response)
            }
        } catch (error) {
            await insertMessageLog(req, LOG_LEVELS.DEBUG, error.message)
            return createResponse(
                STATUS_CODES.INTERNAL_SERVER_ERROR,
                {
                    gateway_ref: gatewayRef,
                    py_ref: pyRef,
                },
                error.message,
            )
        }
    }

    /**
     * Asynchronously updates the transaction log based on the data received from a webhook.
     *
     * This method modifies a transaction log entry in a database when a webhook is received,
     * indicating a change in the status of a transaction. It updates the transaction log with the new status,
     * response details, and the current timestamp. An appropriate HTTP response is sent based on the outcome.
     *
     * @param {any} req - The request object containing details of the transaction and webhook data.
     * @param {any} res - The response object used to send back HTTP response.
     * @returns {Promise<IResponse>} - A promise that resolves with the result of the update operation.
     * @throws - Throws an error if the update operation fails.
     */
    async updateLogByWebhook(req: any, res: any): Promise<IResponse> {
        let status =
            req.details.status == 'successful'
                ? TRANS_STATUS.SUCCESSFUL
                : TRANS_STATUS.FAILED

        try {
            let collection = db
                .get()
                .collection(process.env.DB_TRANSACTIONS_COLLECTION)
            await collection.updateOne(
                { gatewayRef: req.details.txRef },
                {
                    $set: {
                        status,
                        responseBody: req.details,
                        updatedAt: new Date(),
                    },
                },
            )

            // Respond with a success status if update is successful
            return createResponse(STATUS_CODES.OK, {})
        } catch (err) {
            console.error(err.message)
            // Respond with an error status if update fails
            return createResponse(STATUS_CODES.INTERNAL_SERVER_ERROR, {})
        }
    }
}
