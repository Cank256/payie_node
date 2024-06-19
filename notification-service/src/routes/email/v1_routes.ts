/**
 * @fileOverview Routes for the Payie Gateway API version 1 Routes.
 * @module routes/email/v1_routes
 */

'use strict'

import express = require('express')
let router = express.Router()

import { LOG_LEVELS, STATUS_CODES } from '../../utils/constants'
import {
    insertNotificationLog,
    updateNotificationLog,
} from '../../utils/utilities'
import { Service } from '../../services/service'
import {
    getRequestDetails,
    validateRequest,
} from '../../middlewares'

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
        message: 'Payie Email Notification Service v1',
    })
})

router.post('/send', validateRequest, async function (req: any, res, next) {
    let serviceProvider: Service = req.serviceProvider
    console.log(serviceProvider)
    // await insertNotificationLog(req, LOG_LEVELS.INFO)
})

module.exports = router
