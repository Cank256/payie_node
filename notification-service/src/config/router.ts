/**
 * @fileOverview Module for configuring and applying API routes.
 * @module config/router
 */

import * as emailV1Routes from '../routes/email/v1_routes'
import * as smsV1Routes from '../routes/sms/v1_routes'

/**
 * Configures and applies API routes to the Express application.
 * @function
 * @name configureRoutes
 * @param {Object} app - The Express application instance.
 * @memberof module:config/router
 */
module.exports = function (app) {
    /**
     * Mounts version 1 of the API routes under the '/v1' path.
     */
    app.use('/email/v1', emailV1Routes)
    app.use('/sms/v1', smsV1Routes)
    app.get('/favicon.ico', function (req, res) {
        res.sendStatus(204)
    })
}
