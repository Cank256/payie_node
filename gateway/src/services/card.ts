/**
 * @fileOverview Card Class - Manages card transactions, extending from ServiceProvider for shared functionalities.
 * @module services/Card
 * @requires cross-fetch
 * @requires https
 * @requires ../utilities
 * @requires ../constants
 * @requires ./service-provider
 */

import { Service } from "./service";
import { createResponse, generateCode, IConfig, insertMessageLog, IResponse } from "../utils/utilities";
import { LOG_LEVELS, STATUS_CODES, TRANS_STATUS } from "../utils/constants";

const fetch = require('cross-fetch');
const https = require("https");

// Configuration for the https agent, specifically set to ignore unauthorized certificates.
const agent = new https.Agent({
    rejectUnauthorized: false
});

/**
 * Class representing the Card service for handling card transactions.
 * Extends ServiceProvider for common service functionalities.
 */
export default class Card extends Service {
    // Class properties declaration
    protected name: string;
    protected serverUrl: string;
    protected type: string[];
    protected secret_key: string;

    /**
     * Constructs an instance of the Card service.
     * @param {IConfig} initConfig - Configuration details for the Card service.
     */
    constructor(initConfig: IConfig) {
        super();
        this.name = initConfig.name;
        this.serverUrl = initConfig.server_url;
        this.type = initConfig.type;
        this.secret_key = initConfig.secret_key;
    }

    /**
     * Validates a given account, currently returning a generic bad request.
     * @param {any} details - Account details for validation.
     * @returns {Promise<IResponse>} - The response object.
     */
    async validateAccount(details: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST);
    }

    /**
     * Utility method to remove trailing slash from a URL string.
     * @static
     * @param {string} urlString - The URL string to be processed.
     * @returns {string} - Processed URL string without trailing slash.
     */
    static stripTrailingSlash(urlString: string): string {
        return urlString.endsWith("/") ? urlString.slice(0, -1) : urlString;
    }

    /**
     * Handles the collection process for card transactions.
     * @param {any} req - Request object containing transaction details.
     * @returns {Promise<IResponse>} - The response object based on transaction status.
     */
    async collect(req: any): Promise<IResponse> {
        /*get the required parameters*/
        let gatewayRef = req.gatewayRef;
        let details = req.details;
        let currency = details.currency;
        let amount = Number.parseInt(details.amount);
        let pyRef = details.pyRef;

        if (!currency) {
            return createResponse(STATUS_CODES.BAD_REQUEST, {
                gateway_ref: gatewayRef,
                py_ref: pyRef,
            }, 'missing currency.');
        }

        if (!amount) {
            return createResponse(STATUS_CODES.BAD_REQUEST, {
                gateway_ref: gatewayRef,
                py_ref: pyRef,
            }, 'missing amount.');
        }

        /*set up the request parameters*/
        let orderId = generateCode();

        let parameters = {
            tx_ref: orderId,
            amount,
            currency,
            redirect_url: details.redirect_url,
            payment_options: "card",
            customer:{
                name: details.client_name,
                email: details.client_email,
                phonenumber: details.msisdn
            },
            customizations:{
               title: "CankPay",
               description: "Your Swift Payments",
               logo: "https://ugmart.ug/wp-content/uploads/2020/06/cropped-ug-mart-1.png"
            }
        }

        let requestUrl = Card.stripTrailingSlash(this.serverUrl);

        try {

            let response = await fetch(requestUrl, {
                method: 'POST',
                body: JSON.stringify(parameters),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': "Bearer " + this.secret_key
                },
                agent
            }).then(k => k.json()) as any;
            if (response.status.toUpperCase() == TRANS_STATUS.SUCCESSFUL) {
                let data = {
                    status: TRANS_STATUS.PENDING,
                    orderId: orderId,
                    url: response.data.link,
                    gateway_ref: gatewayRef,
                    py_ref: pyRef,
                };
                return createResponse(STATUS_CODES.OK, data);
            }
            else {
                /*add the transaction IDs to the response*/
                response.gateway_ref = gatewayRef;
                response.py_ref = pyRef;
                return createResponse(STATUS_CODES.BAD_REQUEST, response);
            }

        }
        catch (error) {
            await insertMessageLog(req, LOG_LEVELS.DEBUG, error.message);
            return createResponse(STATUS_CODES.INTERNAL_SERVER_ERROR, {
                gateway_ref: gatewayRef,
                py_ref: pyRef
            }, error.message);
        }
    }
}
