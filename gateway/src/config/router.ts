/**
 * @fileOverview Module for configuring and applying API routes.
 * @module config/router
 */

import * as apiV1Routes from '../routes/v1_routes'

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
    app.use('/v1', apiV1Routes)
}
