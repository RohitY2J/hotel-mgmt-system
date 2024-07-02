const express = require('express');
const services = require('../../services');
const router = express.Router();


router.post("/createRoom", services.roomService.createRoom);
router.put("/updateRoom", services.roomService.updateRoom);
router.get("/getRoomById", services.roomService.getRoomById);
router.post("/getRooms", services.roomService.getRooms);

module.exports = router;