/**
 * @fileOverview Entry point for the HTTPS server setup
 * and configuration.
 * @module www
 */

require('dotenv').config()
const app = require('../app')
const debug = require('debug')('proxy:server')
import * as fs from 'fs'
const db = require('../config/db')

const https = require('https')

/**
 * Configuration for the HTTPS server.
 * @const {Object}
 */
const options = {
    key: fs.readFileSync(__dirname + '/../../certs/cert.key'),
    cert: fs.readFileSync(__dirname + '/../../certs/cert.crt'),
}

/**
 * Normalize the given port into a number, string, or false.
 * @function
 * @name normalizePort
 * @param {(string|number|boolean)} val - The port value.
 * @returns {(number|string|boolean)} - The normalized port value.
 */
const normalizePort = (val: string | number | boolean) => {
    const port = parseInt(val as string, 10)

    if (isNaN(port)) {
        return val
    }

    if (port >= 0) {
        return port
    }

    return false
}

/**
 * Set the port for the Express application.
 */
const appPort = normalizePort(process.env.APP_PORT)
app.set('port', appPort)

/**
 * Create an HTTPS server with the specified options and
 * bind it to the Express application.
 */
const server = https.createServer(options, app)

/**
 * Connect to MongoDB and start the server.
 */
db.connect(process.env.DB_LINK, (err) => {
    if (err) {
        console.error(`Unable to connect to MongoDB at ${process.env.DB_LINK}`)
        console.error(err.message)
        process.exit(1)
    } else {
        server.listen(appPort, () => {
            console.log(`MongoDB running on port ${appPort}`)
            console.log(`App running on port ${appPort}`)
        })
    }
})

/**
 * Event listener for HTTP server "error" event.
 * @function
 * @name onError
 * @param {NodeJS.ErrnoException} error - The error object.
 */
const onError = (error: NodeJS.ErrnoException) => {
    if (error.syscall !== 'listen') {
        throw error
    }

    const bind =
        typeof appPort === 'string' ? 'Pipe ' + appPort : 'Port ' + appPort

    // Handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges')
            process.exit(1)
            break
        case 'EADDRINUSE':
            console.error(bind + ' is already in use')
            process.exit(1)
            break
        default:
            throw error
    }
}

/**
 * Event listener for HTTP server "listening" event.
 * @function
 * @name onListening
 */
const onListening = () => {
    const addr = server.address()
    const bind =
        typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port
    debug('Listening on ' + bind)
}

/**
 * Attach event listeners to the server.
 */
server.on('error', onError)
server.on('listening', onListening)
