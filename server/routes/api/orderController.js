const express = require("express");
const router = express.Router();
const service = require("../../services");

router.post('/addOrder', service.orderService.createOrder)
router.post('/getSpecificOrder', service.orderService.getSpecificOrder)
router.post('/getOrders', service.orderService.getOrders);
router.post('/updateStatus', service.orderService.updateStatus);

module.exports = router;