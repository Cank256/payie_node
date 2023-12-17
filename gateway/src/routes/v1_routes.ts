'use strict'
import express = require('express')
let router = express.Router()

//Index of the api
router.get('/', (req: any, res, next) => {
    res.json({ code: 200, success: true, message: 'CankPay Gateway v1' })
})

module.exports = router
