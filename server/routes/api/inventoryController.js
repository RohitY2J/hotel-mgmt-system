const express = require("express");
const services = require("../../services");
const router = express.Router();

router.post("/createInventory", services.inventoryService.createInventoryItem);

router.post("/addInventory", services.inventoryService.addItem);

router.post("/updateInventory", services.inventoryService.updateItems);

router.post("/getItems", services.inventoryService.getItems);

router.get("/getItemById", services.inventoryService.getItemById);

router.delete("/deleteItem", services.inventoryService.deleteItems);
