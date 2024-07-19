const express = require("express");
const services = require("../../services");
const router = express.Router();

router.get("/getDashboardData", services.dashboardService.getDashboardData);

module.exports = router;