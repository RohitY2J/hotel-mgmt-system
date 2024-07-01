const { OperationCanceledException } = require("typescript");
const dbContext = require("../model");

exports.createReservation = async (req) => {
  try {
    var errorMessage = [];
    if (!req.customerFullName)
      errorMessage.push("Customer fullname is required");
    if (!req.customerContact?.phone)
      errorMessage.push("Customer phone number is requried");
    if (!req.checkInDate) errorMessage.push("CheckIn date is requried");

    if (errorMessage)
      throw new OperationCanceledException(
        "One or more error occurred",
        errorMessage
      );

    req.createdAt = Date.now();
    req.updatedAt = Date.now();

    var reservation = new dbContext.Reservation(req);
    reservation.save();
  } catch (ex) {
    throw ex;
  }
};

exports.updateReservation = async (req) => {
  try {
    req.updatedAt = Date.now();
    let result = await dbContext.Reservation.updateOne({ _id: req.id }, req);
    if (result.modifiedCount === 0) console.warn("No documents updated");
    else console.info("Room updated successfully!");
    return result;
  } catch (ex) {
    console.error("Error updating room: ", ex);
    throw ex;
  }
};

exports.getReservationById = async (req) => {
  try {
    var result = await dbContext.Reservation.findOne(req);
    return result;
  } catch (ex) {
    console.error("Error occurred while getting room!", ex);
  }
};

exports.getReservations = async (req) => {
  try {
    var result = await dbContext.Reservation.find(req);
    return result;
  } catch (ex) {
    console.error("Error occurred while getting room!", ex);
  }
};
