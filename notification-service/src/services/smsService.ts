import { Service } from './service'
import {
    createResponse,
    IConfig,
    IResponse,
    insertMessageLog,
} from '../utils/utilities'
import { STATUS_CODES, LOG_LEVELS } from '../utils/constants'
const axios = require('axios')
const https = require('https')
const querystring = require('querystring')

const agent = new https.Agent({
    rejectUnauthorized: false,
})

export default class SmsService extends Service {
    private smsMessageLength: number
    private authUrl: string
    private secret: string
    private clientId: string

    constructor(initConfig: IConfig) {
        super()
        this.name = initConfig.name
        this.authUrl = initConfig.auth_url
        this.type = initConfig.type
        this.clientId = initConfig.client_id
        this.secret = initConfig.secret
        this.smsMessageLength = 160
    }

    async validateAccount(details: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST)
    }

    static stripTrailingSlash(urlString) {
        return urlString.endsWith('/') ? urlString.slice(0, -1) : urlString
    }

    async getAccessToken() {
        try {

            let params = querystring.stringify({
                client_id: this.clientId,
                secret: this.secret,
                expires_in: 60,
            })
            let requestUrl =
                SmsService.stripTrailingSlash(this.authUrl) + '?' + params

            const response = await axios.post(
                requestUrl,
                {},
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    httpsAgent: agent,
                },
            )

            return response.data
        } catch (error) {
            return createResponse(
                STATUS_CODES.INTERNAL_SERVER_ERROR,
                error,
                'Access Token creation failed',
            )
        }
    }

    async getToken(): Promise<IResponse> {
        try {

            let parameters = querystring.stringify({
                client_id: this.clientId,
                secret: this.secret,
                expires_in: 60,
            })
            let requestUrl =
                SmsService.stripTrailingSlash(this.authUrl) + '?' + parameters

            const response = await axios.post(
                requestUrl,
                {},
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    httpsAgent: agent,
                },
            )

            if (
                response.data.token &&
                response.data.expires_in &&
                response.data.email
            ) {
                return createResponse(STATUS_CODES.OK, response.data)
            } else {
                return createResponse(
                    STATUS_CODES.UNPROCESSABLE_ENTITY,
                    response.data,
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

    async sendSms(req: any): Promise<IResponse> {
        let internalTransactionId = req.internalTransactionId
        let details = req.details
        let externalTransactionId = details.externalTransactionId
        let smsFrom = details.from
        let recipients = details.to
        let smsMessage = details.message

        if (!smsFrom) {
            return createResponse(
                STATUS_CODES.BAD_REQUEST,
                {
                    internal_transaction_id: internalTransactionId,
                    external_transaction_id: externalTransactionId,
                },
                "Missing Sender ID 'from'.",
            )
        }

        if (recipients.length == 0) {
            return createResponse(
                STATUS_CODES.BAD_REQUEST,
                {
                    internal_transaction_id: internalTransactionId,
                    external_transaction_id: externalTransactionId,
                },
                "Missing Recipient(s) 'to'.",
            )
        }

        if (!smsMessage) {
            return createResponse(
                STATUS_CODES.BAD_REQUEST,
                {
                    internal_transaction_id: internalTransactionId,
                    external_transaction_id: externalTransactionId,
                },
                "Missing Message 'message'.",
            )
        } else if (smsMessage.length > this.smsMessageLength) {
            return createResponse(
                STATUS_CODES.BAD_REQUEST,
                {
                    internal_transaction_id: internalTransactionId,
                    external_transaction_id: externalTransactionId,
                },
                `Text Message should be at most ${this.smsMessageLength} characters`,
            )
        }

        let reply: IResponse = await this.getToken()

        if (reply.data.jwt && reply.data.token_type) {
            try {

                let sms_params = querystring.stringify({
                    to: recipients,
                    sender_id: smsFrom || 'Payie',
                    message: smsMessage,
                })
                let sms_send_url = 'https://api.sms.to/sms/send?' + sms_params

                const response = await axios.post(
                    sms_send_url,
                    {},
                    {
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                            Authorization: 'Bearer ' + reply.data.jwt,
                        },
                        httpsAgent: agent,
                    },
                )

                if (response.data.success) {
                    return createResponse(STATUS_CODES.OK, response.data)
                } else {
                    return createResponse(
                        STATUS_CODES.UNPROCESSABLE_ENTITY,
                        response.data,
                        'SMS Sending Failed',
                    )
                }
            } catch (error) {
                await insertMessageLog(req, LOG_LEVELS.DEBUG, error.message)
                return createResponse(
                    STATUS_CODES.INTERNAL_SERVER_ERROR,
                    {
                        internal_transaction_id: internalTransactionId,
                        external_transaction_id: externalTransactionId,
                    },
                    error.message,
                )
            }
        } else {
            return createResponse(
                STATUS_CODES.UNPROCESSABLE_ENTITY,
                reply,
                'Access Token Details not found',
            )
        }
    }
}
