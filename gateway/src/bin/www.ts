require('dotenv').config();
const app = require('../app');
const debug = require('debug')('proxy:server');
import * as fs from 'fs';
const db = require('../config/db');
const { MongoClient } = require('mongodb');

const https = require('https');

const options = {
    key: fs.readFileSync(__dirname + '/../../certs/cert.key'),
    cert: fs.readFileSync(__dirname + '/../../certs/cert.crt'),
};

const appPort = normalizePort(process.env.APP_PORT);
const dbPort = normalizePort(process.env.DB_PORT);

app.set('port', appPort);

const server = https.createServer(options, app);

db.connect(process.env.DB_LINK, (err) => {
    if (err) {
        console.error(`Unable to connect to MongoDB at ${process.env.DB_LINK}`);
        console.error(err.message);
        process.exit(1);
    } else {
        server.listen(appPort, () => {
            console.log(`MongoDB running on port ${dbPort}`);
            console.log(`App running on port ${appPort}`);
        });
    }
});

server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val: string | number | boolean) {
    const port = parseInt(val as string, 10);

    if (isNaN(port)) {
        return val;
    }

    if (port >= 0) {
        return port;
    }

    return false;
}

function onError(error: NodeJS.ErrnoException) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof appPort === 'string' ? 'Pipe ' + appPort : 'Port ' + appPort;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port;
    debug('Listening on ' + bind);
}
