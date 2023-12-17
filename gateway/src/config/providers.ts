let nconf = require('nconf')
let fs = require('fs')
let path = require('path')

function Config() {
    if (
        process.env.NODE_ENV == 'development' ||
        process.env.NODE_ENV == 'production'
    ) {
        let configFile = path.join(__dirname, '/../.providers.json')
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

Config.prototype.get = function (key) {
    return nconf.get(key)
}

module.exports = new Config()
