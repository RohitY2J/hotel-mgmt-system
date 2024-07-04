const express = require("express");
const services = require("../../services");
const router = express.Router();

router.post("/createReservation", services.reservationService.createReservation);
router.put("/updateReservation", services.reservationService.updateReservation);
router.post("/addCustomerOrders", services.reservationService.addOrdersForCustomer);
router.get("/getReservationById", services.reservationService.getReservationById);
router.post(
  "/getReservations",
  services.reservationService.getReservations
);

module.exports = router;
