/**
 * @fileOverview MtnMomo Class - Handles interactions with MTN Mobile Money API for both collection and disbursement.
 * @module services/MtnMomo
 * @requires fetch
 * @requires https
 * @requires timers
 * @requires uuid
 * @requires ../utils/constants
 * @requires ../utils/utilities
 * @requires ./service
 */

require('dotenv').config()
import {
    LOG_LEVELS,
    STATUS_CODES,
    TRANS_STATUS,
    TRANS_TYPES,
} from '../utils/constants'
import {
    IResponse,
    createResponse,
    IConfig,
    insertMessageLog,
} from '../utils/utilities'
import { Service } from './service'
import { clearInterval, setInterval } from 'timers'

const { v4: uuidv4 } = require('uuid')
const fetch = require('cross-fetch')
const https = require('https')
const agent = new https.Agent({
    rejectUnauthorized: false,
})

const db = require('../config/db')

/**
 * Class representing the MtnMomo Service for payment transactions.
 * @extends Service
 */
export default class MtnMomo extends Service {
    private collectionUrl: string
    private disbursementUrl: string
    private provider_env: string

    /**
     * Create an instance of the MtnMomo service.
     * @param {IConfig} initConfig - Configuration details for the MtnMomo service.
     */
    constructor(initConfig: IConfig) {
        super()
        this.name = initConfig.name
        this.serverUrl = initConfig.server_url
        this.type = initConfig.type
        this.providerEnv = initConfig.provider_env
        this.apiUser = initConfig.api_user
        this.apiKey = initConfig.api_key
        this.collectionSubscriptionKey = initConfig.collection_subscription_key
        this.payoutSubscriptionKey = initConfig.payout_subscription_key
        this.providerCallbackUrl = initConfig.provider_callback_url
        this.requestCallback = true
        this.requestPayoutCallback = true

        /* Set up the collection and disbursement URLs */
        this.collectionUrl = this.serverUrl.endsWith('/')
            ? `${this.serverUrl}collection`
            : `${this.serverUrl}/collection`
        this.disbursementUrl = this.serverUrl.endsWith('/')
            ? `${this.serverUrl}disbursement`
            : `${this.serverUrl}/disbursement`
    }

    /**
     * Strip trailing slash from the given URL.
     * @static
     * @param {string} urlString - The URL string.
     * @returns {string} - URL without trailing slash.
     */
    static stripTrailingSlash(urlString: string): string {
        return urlString.endsWith('/') ? urlString.slice(0, -1) : urlString
    }

    /**
     * Get access token for authenticating Momo API Access.
     * @async
     * @param {string} transType - Transaction type (COLLECTION or DISBURSEMENT).
     * @returns {Promise<IResponse>} - API response containing access token details.
     */
    async getAccessToken(transType: string): Promise<IResponse> {
        let requestUrl =
            transType.toLowerCase() == TRANS_TYPES.COLLECTION
                ? `${this.collectionUrl}/token/`
                : `${this.disbursementUrl}/token/`

        let subscriptionKey =
            transType.toLowerCase() == TRANS_TYPES.COLLECTION
                ? this.collectionSubscriptionKey
                : this.payoutSubscriptionKey

        try {
            let parameters = {}
            let response = (await fetch(requestUrl, {
                method: 'POST',
                body: JSON.stringify(parameters),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization:
                        'Basic ' +
                        Buffer.from(
                            this.apiUser + ':' + this.apiKey,
                            'utf8',
                        ).toString('base64'),
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                },
                agent,
            }).then((k) => k.json())) as any

            if (
                response.access_token &&
                response.token_type &&
                response.expires_in
            ) {
                return createResponse(STATUS_CODES.OK, response)
            } else {
                return createResponse(
                    STATUS_CODES.UNPROCESSABLE_ENTITY,
                    response,
                    'Access Token Details not found',
                )
            }
        } catch (error) {
            return createResponse(
                STATUS_CODES.INTERNAL_SERVER_ERROR,
                error,
                'Access Token creation failed',
            )
        }
    }

    /**
     * Validate an account using MTN Mobile Money API.
     * @async
     * @param {Object} req - The request object.
     * @returns {Promise<IResponse>} - API response indicating the account validation status.
     */
    async validateAccount(req: any): Promise<IResponse> {
        let gatewayRef = req.gatewayRef
        let details = req.details
        let msisdn = details.msisdn
        let pyRef = details.pyRef

        if (!msisdn) {
            return createResponse(STATUS_CODES.BAD_REQUEST, {
                error: 'msisdn missing',
                gateway_ref: gatewayRef,
                py_ref: pyRef,
            })
        }

        let requestUrl =
            MtnMomo.stripTrailingSlash(this.collectionUrl) +
            '/v1_0/accountholder/msisdn/' +
            msisdn +
            '/basicuserinfo'
        let accessTokenRequest: IResponse = await this.getAccessToken(
            TRANS_TYPES.COLLECTION,
        )

        try {
            let response = (await fetch(requestUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessTokenRequest.data.access_token}`,
                    'X-Target-Environment': this.provider_env || 'sandbox',
                    'Ocp-Apim-Subscription-Key': this.collectionSubscriptionKey,
                },
                agent,
            }).then((k) => k.json())) as any

            if (response.name) {
                let response_data = {
                    valid: true,
                    name: response.name,
                    msisdn: msisdn,
                }
                return createResponse(STATUS_CODES.OK, response_data)
            } else {
                return createResponse(
                    STATUS_CODES.UNPROCESSABLE_ENTITY,
                    response,
                    'MSISDN User not found',
                )
            }
        } catch (error) {
            return createResponse(
                STATUS_CODES.INTERNAL_SERVER_ERROR,
                error,
                'MSISDN validation action failed',
            )
        }
    }

    /**
     * Initiates a collection transaction for Mobile Money payments.
     *
     * @async
     * @function
     * @param {Object} req - The request object containing transaction details.
     * @param {function} callback - The callback function to handle the response.
     * @returns {Promise<IResponse>} - A promise that resolves to the transaction response.
     */
    async collect(req: any, callback): Promise<IResponse> {
        // Extract transaction details from the request.
        let gatewayRef = req.gatewayRef
        let details = req.details
        let msisdn = details.msisdn
        let amount = Number.parseInt(details.amount)
        let pyRef = details.pyRef
        let currency = details.currency || 'UGX'

        // Validate required parameters.
        if (!msisdn) {
            return callback(
                createResponse(
                    STATUS_CODES.BAD_REQUEST,
                    {
                        gateway_ref: gatewayRef,
                        py_ref: pyRef,
                    },
                    'Missing msisdn.',
                ),
            )
        }

        if (!amount) {
            return callback(
                createResponse(
                    STATUS_CODES.BAD_REQUEST,
                    {
                        gateway_ref: gatewayRef,
                        py_ref: pyRef,
                    },
                    'Missing amount.',
                ),
            )
        }

        // Set default description if not provided.
        let description = details.description || 'Payie Collection'
        
        // Prepare parameters for the collection request.
        let parameters = {
            amount: amount.toString(),
            currency: currency,
            externalId: gatewayRef,
            payer: {
                partyIdType: 'MSISDN',
                partyId: msisdn,
            },
            payerMessage: description,
            payeeNote: description,
        }

        // Generate a reference ID for the transaction.
        let referenceId = uuidv4()

        // Set up the request URL for initiating the collection.
        let requestUrl =
            MtnMomo.stripTrailingSlash(this.collectionUrl) +
            '/v1_0/requesttopay'

        // Obtain an access token for authenticating the API request.
        let accessTokenRequest: IResponse = await this.getAccessToken(
            TRANS_TYPES.COLLECTION,
        )

        // Check if the access token is successfully obtained.
        if (accessTokenRequest.code == STATUS_CODES.OK) {
            try {
                // Access the MongoDB collection for storing transaction details.
                let collection = db
                    .get()
                    .collection(process.env.DB_MOMO_IPS_COLLECTION)

                // Insert a record for the initiated transaction in the database.
                await collection.insertOne({
                    reference: gatewayRef,
                    py_ref: pyRef,
                    msisdn,
                    amount,
                    status: TRANS_STATUS.PENDING,
                    type: TRANS_TYPES.COLLECTION,
                    x_reference_id: referenceId,
                    provider_transaction_id: null,
                    message: 'Transaction Initiated',
                    created_at: new Date(),
                    callback_received: false,
                    completed_by: null,
                    completed_at: null,
                    callback_time: null,
                    meta: {},
                })

                // Perform the collection request using the configured service provider.
                await fetch(requestUrl, {
                    method: 'POST',
                    body: JSON.stringify(parameters),
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessTokenRequest.data.access_token}`,
                        'X-Reference-Id': referenceId,
                        'X-Target-Environment': this.provider_env || 'sandbox',
                        'Ocp-Apim-Subscription-Key': this.collectionSubscriptionKey,
                    },
                    agent,
                }).then(async (response) => {
                    // Check if the request was successful.
                    if (response.status == STATUS_CODES.OK || response.status == STATUS_CODES.ACCEPTED ) {
                        try {
                            
                            await collection.updateOne({
                                reference: gatewayRef,
                            }, {
                                $set: {
                                    status: TRANS_STATUS.COMPLETED,
                                    completed_at: new Date(),
                                    completed_by: 'REQUEST',
                                    message: response.status + '-' + response.statusText,
                                },
                            })
                            
                            let transaction = await collection.findOne({
                                reference: gatewayRef,
                            })

                            return callback(
                                createResponse(STATUS_CODES.OK, {
                                    msisdn,
                                    amount,
                                    message: 'Transaction successfully completed.',
                                    status: transaction.status,
                                    provider_id: transaction.provider_transaction_id,
                                    gateway_ref: gatewayRef,
                                    py_ref: pyRef,
                                }),
                            )
                            
                        } catch (e) {
                            // Log any errors that occur during the process.
                            await insertMessageLog(
                                req,
                                LOG_LEVELS.DEBUG,
                                e.message,
                            )
                        }
                    } else {
                        // Log the error and update the transaction status in the database.
                        await insertMessageLog(
                            req,
                            LOG_LEVELS.DEBUG,
                            response.status + '-' + response.statusText,
                        )

                        // Query the record and edit it in case of an error.
                        let record = await collection.findOne({
                            reference: gatewayRef,
                        })

                        await collection.updateOne(record, {
                            $set: {
                                status: TRANS_STATUS.FAILED,
                                completed_at: new Date(),
                                completed_by: 'REQUEST',
                                message: response.statusText ||
                                    'Transaction Request Failed.',
                            },
                        })

                        return callback(
                            createResponse(
                                STATUS_CODES.UNPROCESSABLE_ENTITY,
                                {
                                    msisdn,
                                    amount,
                                    message: record.message,
                                    status: record.status,
                                    gateway_ref: gatewayRef,
                                    py_ref: pyRef,
                                },
                            ),
                        )
                    }
                })
            } catch (e) {
                // Log any unexpected errors that may occur.
                await insertMessageLog(req, LOG_LEVELS.DEBUG, e.message)
                return callback(
                    createResponse(
                        STATUS_CODES.INTERNAL_SERVER_ERROR,
                        {
                            gateway_ref: gatewayRef,
                            py_ref: pyRef,
                            error: e,
                        },
                        e.message,
                    ),
                )
            }
        } else {
            // Return the access token request response in case of failure.
            return callback(accessTokenRequest)
        }
    }

    /**
     * Asynchronously processes a transfer request and executes a callback with the response.
     * 
     * @async
     * @function
     * @param {any} req - The request object containing transfer details.
     * @param {Function} callback - A callback function to handle the response.
     * @returns {Promise<IResponse>} A promise that resolves to a response object.
     */
    async transfer(req: any, callback): Promise<IResponse> {
        let gatewayRef = req.gatewayRef;

        let details = req.details;
        let msisdn = details.msisdn;
        let amount = details.amount;
        let currency = details.currency || "UGX";
        let pyRef = details.pyRef;

        let description = details.description || 'CankPay Transfers.';

        if (!msisdn) {
            return callback(createResponse(STATUS_CODES.BAD_REQUEST,
                {
                    gateway_ref: gatewayRef,
                    py_ref: pyRef,
                }, 'missing msisdn.'
            ));
        }

        if (!amount) {
            return callback(createResponse(STATUS_CODES.BAD_REQUEST,
                {
                    gateway_ref: gatewayRef,
                    py_ref: pyRef,
                }, 'missing amount.'
            ));
        }

        let parameters = {
            amount: amount.toString(),
            currency,
            externalId: gatewayRef,
            payee: {
                partyIdType: "MSISDN",
                partyId: msisdn
            },
            payerMessage: description.substr(0, 140),
            payeeNote: description.substr(0, 140)
        };
        
        let referenceId = uuidv4();
        let requestUrl = MtnMomo.stripTrailingSlash(this.disbursementUrl) + "/v1_0/transfer";
        let accessTokenRequest: IResponse = await this.getAccessToken(TRANS_TYPES.PAYOUT);

        if (accessTokenRequest.code == STATUS_CODES.OK) {
            try {
                let collection = db.get().collection(process.env.DB_MOMO_IPS_COLLECTION);
                await collection.insertOne({
                    reference: gatewayRef,
                    py_ref: pyRef,
                    msisdn,
                    amount,
                    status: TRANS_STATUS.PENDING,
                    type: TRANS_TYPES.PAYOUT,
                    x_reference_id: referenceId,
                    provider_transaction_id: null,
                    message: "Transaction Initiated",
                    created_at: new Date(),
                    callback_received: false,
                    completed_by: null,
                    completed_at: null,
                    callback_time: null,
                    meta: {},
                });

                await fetch(requestUrl, {
                    method: 'POST',
                    body: JSON.stringify(parameters),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessTokenRequest.data.access_token}`,
                        'X-Reference-Id': referenceId,
                        'X-Target-Environment': this.provider_env || 'sandbox',
                        'Ocp-Apim-Subscription-Key': this.payoutSubscriptionKey,
                        // 'X-Callback-Url': this.providerCallbackUrl
                    },
                    agent
                }).then(async (response) => {
                    // Check if the request was successful.
                    if (response.status == STATUS_CODES.OK || response.status == STATUS_CODES.ACCEPTED ) {
                        try {
                            
                            await collection.updateOne({
                                reference: gatewayRef,
                            }, {
                                $set: {
                                    status: TRANS_STATUS.COMPLETED,
                                    completed_at: new Date(),
                                    completed_by: 'REQUEST',
                                    message: response.status + '-' + response.statusText,
                                },
                            })
                            
                            let transaction = await collection.findOne({
                                reference: gatewayRef,
                            })

                            return callback(
                                createResponse(STATUS_CODES.OK, {
                                    msisdn,
                                    amount,
                                    message: 'Transaction successfully completed.',
                                    status: transaction.status,
                                    provider_id: transaction.provider_transaction_id,
                                    gateway_ref: gatewayRef,
                                    py_ref: pyRef,
                                }),
                            )
                            
                        } catch (e) {
                            // Log any errors that occur during the process.
                            await insertMessageLog(
                                req,
                                LOG_LEVELS.DEBUG,
                                e.message,
                            )
                        }
                    } else {
                        // Log the error and update the transaction status in the database.
                        await insertMessageLog(
                            req,
                            LOG_LEVELS.DEBUG,
                            response.status + '-' + response.statusText,
                        )

                        // Query the record and edit it in case of an error.
                        let record = await collection.findOne({
                            reference: gatewayRef,
                        })

                        await collection.updateOne(record, {
                            $set: {
                                status: TRANS_STATUS.FAILED,
                                completed_at: new Date(),
                                completed_by: 'REQUEST',
                                message: response.statusText ||
                                    'Transaction Request Failed.',
                            },
                        })

                        return callback(
                            createResponse(
                                STATUS_CODES.UNPROCESSABLE_ENTITY,
                                {
                                    msisdn,
                                    amount,
                                    message: record.message,
                                    status: record.status,
                                    gateway_ref: gatewayRef,
                                    py_ref: pyRef,
                                },
                            ),
                        )
                    }
                });
            } catch (e) {
                await insertMessageLog(req, LOG_LEVELS.DEBUG, e.message);
                return callback(createResponse(STATUS_CODES.INTERNAL_SERVER_ERROR, {
                    gateway_ref: gatewayRef,
                    py_ref: pyRef,
                }, e.message));
            }
        }
        else {
            return callback(accessTokenRequest);
        }
    }
}
