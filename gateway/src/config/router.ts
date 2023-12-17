import * as apiV1Routes from '../routes/v1_routes'

module.exports = function (app) {
    app.use('/v1', apiV1Routes)
}
