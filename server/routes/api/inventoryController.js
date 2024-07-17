const express = require("express");
const services = require("../../services");
const router = express.Router();
const { FileUpload } = require('../../helper/file_upload');

router.post("/createInventory", FileUpload.single('file'), services.inventoryService.createInventoryItem);

router.post("/add", services.inventoryService.addItem);

router.post("/dispatch", services.inventoryService.dispatchItem);

router.post("/history", services.inventoryService.getAddDispatchHistory);

router.post("/updateInventory", services.inventoryService.updateItems);

router.post("/getItems", services.inventoryService.getItems);

router.get("/getItemById", services.inventoryService.getItemById);

router.delete("/deleteItem", services.inventoryService.deleteItems);

module.exports = router;