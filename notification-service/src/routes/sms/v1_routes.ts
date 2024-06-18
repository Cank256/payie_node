/**
 * @fileOverview Routes for the Payie Gateway API version 1 Routes.
 * @module routes/sms/v1_routes
 */

'use strict'

import express = require('express')
let router = express.Router()

import { LOG_LEVELS, STATUS_CODES } from '../../utils/constants'
import {
    createResponse,
    findDocuments,
    findNotification,
    getServiceProvider,
    getServiceProviders,
    insertNotificationLog,
    updateNotificationLog,
} from '../../utils/utilities'
const db = require('../../config/db')

/**
 * Redis Cache key prefix for API routes.
 * @const {string}
 */
const CACHE_KEY = 'payie_notifications_v1-'

/**
 * Time to live (TTL) for redis cached data in seconds.
 * @const {number}
 */
const CACHE_TTL = 60 * 60

router.get('/', (req: any, res, next) => {
    res.json({
        code: STATUS_CODES.OK,
        success: true,
        message: 'Payie SMS Notification Service v1',
    })
})

router.post('/send', (req: any, res, next) => {
    res.json({
        code: STATUS_CODES.OK,
        success: true,
        message: 'Send SMS Notification',
    })
})

module.exports = router