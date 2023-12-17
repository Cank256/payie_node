import express = require('express')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const timeout = require('express-timeout-handler')
let router = require('./config/router')
let app = express()

app.enable('trust proxy')
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

// Default timeout handler calls.
let timeoutOptions = {
    timeout: 480000, // ms == 8 minutes

    onTimeout: function (req, res) {
        res.status(408)
    },
}
app.use(timeout.handler(timeoutOptions))

router(app)

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err: any
    err = new Error('Not Found')
    err.status = 404
    next(err)
})

// Custom error handler for 404 Not Found
app.use(function (err, req, res, next) {
    if (err.status === 404) {
        res.status(404)
    } else {
        // set locals, only providing error in development
        res.locals.message = err.message
        res.locals.error = req.app.get('env') === 'development' ? err : {}

        // render the error page
        res.status(err.status || 500)
        res.render('error')
    }
})

module.exports = app
