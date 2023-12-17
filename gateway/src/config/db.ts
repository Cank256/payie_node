/**
 * @fileOverview Module for connecting to MongoDB, retrieving the
 * database instance, and closing the connection.
 * @module db
 */

const { MongoClient } = require('mongodb')

/**
 * State object to keep track of the MongoDB connection and
 * database instance.
 * @type {Object}
 * @property {?Object} db - The MongoDB database instance.
 */
let state = {
    db: null,
}

/**
 * Connects to the MongoDB server and sets the state with the
 * database instance.
 * @function
 * @name connect
 * @memberof module:db
 * @param {string} url - The MongoDB connection URL.
 * @param {function} done - Callback function to be executed
 * once the connection is established or encounters an error.
 */
exports.connect = async function (url, done) {
    if (state.db) return done()

    const client = new MongoClient(url)

    try {
        await client.connect()
        state.db = client.db('gateway')
        done()
    } catch (err) {
        return done(err)
    }
}

/**
 * Retrieves the MongoDB database instance.
 * @function
 * @name get
 * @memberof module:db
 * @returns {?Object} - The MongoDB database instance.
 */
exports.get = function () {
    return state.db
}

/**
 * Closes the MongoDB connection and resets the state.
 * @function
 * @name close
 * @memberof module:db
 * @param {function} done - Callback function to be executed
 * once the connection is closed or encounters an error.
 */
exports.close = function (done) {
    if (state.db) {
        state.db.close(function (err) {
            state.db = null
            done(err)
        })
    }
}
