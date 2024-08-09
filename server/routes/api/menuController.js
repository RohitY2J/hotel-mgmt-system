const express = require("express");
const router = express.Router();
const service = require("../../services");
const { FileUpload } = require('../../helper/file_upload');

router.post('/createMenuItem', FileUpload.single('file'), service.menuService.createMenuItem)

router.post('/updateMenuItem', FileUpload.single('file'), service.menuService.updateMenuItem)

router.post('/getMenuItems', service.menuService.getMenuItems)

router.post('/getMenuName', service.menuService.getMenuNames)

module.exports = router;