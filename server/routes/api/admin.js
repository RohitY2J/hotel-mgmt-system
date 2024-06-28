const express = require('express')
const router = express.Router()

router.post('/createEmployee', async (req, res, next) => {
    let employee = req.body;
})

module.exports = router;
