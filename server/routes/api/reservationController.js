const express = require("express");
const services = require("../../services");
const router = express.Router();

router.post("/createReservation", services.reservationService.createReservation);
router.put("/updateReservation", services.reservationService.updateReservation);
router.get("/getReservationById", services.reservationService.getReservationById);
router.get(
  "/getReservations",
  services.reservationService.getReservations
);

module.exports = router;
