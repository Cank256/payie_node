/**
 * @fileOverview Module for handling configuration using nconf.
 * @module config
 */

let nconf = require('nconf')
let fs = require('fs')
let path = require('path')

/**
 * Configuration class for managing application settings.
 * @class
 * @name Config
 */
function Config() {
    /**
     * Loads configuration based on the current environment.
     * @constructor
     * @memberof module:config
     * @throws {Object} FileNotFoundException - Thrown if the
     * configuration file is not found.
     */
    if (
        process.env.NODE_ENV == 'development' ||
        process.env.NODE_ENV == 'production'
    ) {
        let configFile = path.join(__dirname, '../../.providers.json')
        if (!fs.existsSync(configFile)) {
            throw {
                name: 'FileNotFoundException',
                message: 'Unable to find configFile ' + configFile,
            }
        }

        nconf.argv().env().file(configFile)
    } else {
        nconf.argv().env().file({ file: './.providers-copy.json' })
    }
}

/**
 * Retrieves the configuration value for the specified key.
 * @method
 * @name get
 * @memberof module:config.Config
 * @param {string} key - The key for the configuration value.
 * @returns {*} - The configuration value associated with the
 * provided key.
 */
Config.prototype.get = function (key) {
    return nconf.get(key)
}

/**
 * Exports an instance of the Config class.
 */
module.exports = new Config()
