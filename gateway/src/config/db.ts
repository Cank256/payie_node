const { MongoClient } = require('mongodb');

let state = {
    db: null,
};

exports.connect = async function (url, done) {
    if (state.db) return done();
    const client = new MongoClient(url);
    await client.connect()
        .then(() => {
            state.db = client.db('gateway')
            done();
        })
        .catch((err) => { return done(err) })
};

exports.get = function () {
    return state.db;
};

exports.close = function (done) {
    if (state.db) {
        state.db.close(function (err) {
            state.db = null;
            done(err);
        });
    }
};
