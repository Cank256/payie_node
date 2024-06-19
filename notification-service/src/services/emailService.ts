const nodemailer = require('nodemailer');
import { Service } from './service';
import {
    createResponse,
    insertMessageLog,
    IConfig
} from '../utils/utilities';
const { LOG_LEVELS, STATUS_CODES } = require('../utils/constants');

export default class EmailService extends Service {
    protected transporter: any

    constructor(initConfig: IConfig) {
        super();
        this.transporter = nodemailer.createTransport({
            host: initConfig.host,
            port: initConfig.port,
            secure: initConfig.secure,
            auth: {
                user: initConfig.user_name,
                pass: initConfig.password,
            },
        });
    }

    async sendEmail(details) {
        try {
            const mailOptions = {
                from: details.from,
                to: details.to,
                subject: details.subject,
                text: details.message,
            };

            const info = await this.transporter.sendMail(mailOptions);

            insertMessageLog(details, LOG_LEVELS.INFO, `Email sent: ${info.messageId}`);
            return createResponse(STATUS_CODES.OK);
        } catch (error) {
            console.log(error)
            insertMessageLog(details, LOG_LEVELS.ERROR, error.message);
            return createResponse(STATUS_CODES.INTERNAL_SERVER_ERROR);
        }
    }
}
