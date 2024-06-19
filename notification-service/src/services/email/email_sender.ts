import { SMTPClient } from 'emailjs'
import { Service } from '../service'
import {
    createResponse,
    IConfig,
    insertMessageLog,
    IResponse,
} from '../../utils/utilities'
import { LOG_LEVELS, STATUS_CODES } from '../../utils/constants'

export default class Email extends Service {
    protected name: string
    protected serverUrl: string
    protected type: string[]
    protected secret_key: string
    protected client: SMTPClient

    constructor(initConfig: IConfig) {
        super()
        this.name = initConfig.name
        this.serverUrl = initConfig.server_url
        this.type = initConfig.type
        this.secret_key = initConfig.secret_key
        this.client = new SMTPClient({
            user: initConfig.user_name,
            password: initConfig.password,
            host: initConfig.host,
            ssl: true,
        })
    }

    async sendEmail(details: any): Promise<IResponse> {
        try {
            const message = {
                from: details.from,
                to: details.to,
                subject: details.subject,
                text: details.message,
            }
            this.client.send(message, (err: any, message) => {
                if (err) {
                    insertMessageLog(details, LOG_LEVELS.ERROR, err.message)
                    return createResponse(STATUS_CODES.INTERNAL_SERVER_ERROR)
                }
                insertMessageLog(details, LOG_LEVELS.INFO, err.message)
                return createResponse(STATUS_CODES.OK)
            })
        } catch (error) {
            insertMessageLog(details, LOG_LEVELS.ERROR, error)
            return createResponse(STATUS_CODES.INTERNAL_SERVER_ERROR)
        }
    }
}
