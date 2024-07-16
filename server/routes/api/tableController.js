const express = require("express");
const router = express.Router();
const service = require("../../services");

router.post('/createTable', service.tableService.createTable)

router.post('/updateTable', service.tableService.updateTable)

router.post('/getTables', service.tableService.getTabels);

module.exports = router;