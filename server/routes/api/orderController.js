const express = require("express");
const router = express.Router();
const service = require("../../services");
const { FileUpload } = require('../../helper/file_upload');

router.post('/addOrder', service.orderService.createOrder)
router.post('/getSpecificOrder', service.orderService.getSpecificOrder)

module.exports = router;