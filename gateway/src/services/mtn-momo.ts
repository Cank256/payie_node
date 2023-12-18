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

}
