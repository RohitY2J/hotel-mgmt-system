const express = require("express");
const router = express.Router();
const service = require("../../services");

router.post('/addOrder', service.orderService.createOrder)
router.post('/getSpecificOrder', service.orderService.getSpecificOrder)
router.post('/getOrders', service.orderService.getOrders);
router.post('/getOrderBills', service.orderService.getOrderBills);
router.post('/updateStatus', service.orderService.updateStatus);
// router.post('/updateOrder', service.orderService.updateOrder);
router.post('/billOrder', service.orderService.billOrder); 

module.exports = router;