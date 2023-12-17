/**
 * @fileOverview Redis configuration and utility functions for caching.
 * @module config/redis
 */

const Redis = require('redis')

/**
 * Redis client configuration.
 * @const {Object}
 * @property {string} host - The Redis server host.
 * @property {number} port - The Redis server port.
 */
const client = Redis.createClient({
    host: 'localhost',
    port: 6379,
    // other configuration options
})

/**
 * Connect to the Redis server.
 * @function
 * @name connect
 * @memberof module:config/redis
 */
client.connect()

/**
 * Retrieve data from the Redis cache.
 *
 * @async
 * @function
 * @name get
 * @memberof module:config/redis
 * @param {string} key - The key to retrieve from the cache.
 * @returns {Object} - An object containing the status and cached data.
 * @throws {Error} - Throws an error if there's an issue with Redis operations.
 */
const get = async (key) => {
    try {
        const cachedResponse = await client.get(key)
        if (cachedResponse) {
            return { status: true, data: cachedResponse }
        } else {
            return { status: false, data: null }
        }
    } catch (err) {
        console.error(err)
        return { error: 'Internal Server Error' }
    }
}

/**
 * Set data in the Redis cache with an optional time-to-live (TTL).
 *
 * @async
 * @function
 * @name set
 * @memberof module:config/redis
 * @param {string} key - The key to set in the cache.
 * @param {string} data - The data to cache.
 * @param {number} ttl - Time-to-live (expiration time) for the cached data in seconds.
 * @returns {Object} - An object containing the status of the set operation.
 * @throws {Error} - Throws an error if there's an issue with Redis operations.
 */
const set = async (key, data, ttl) => {
    try {
        await client.set(key, data, 'EX', ttl) // Set cache with expiration time (ttl)
        return { status: true }
    } catch (err) {
        console.error(err)
        return { error: 'Internal Server Error' }
    }
}

module.exports = {
    client,
    get,
    set,
}
