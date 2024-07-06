const { OperationCanceledException } = require("typescript");
const dbContext = require("../model");

const mongoose = require("mongoose");


exports.createRoom = async (req, res, next) => {
  try {
    var errorMessage = [];
    let request = req.body;
    if (!request.roomNumber) errorMessage.push("Room number is required");
    if (!request.occupancyStatus)
      errorMessage.push("Occupancy status is requried");
    if (!request.maintainanceStatus)
      errorMessage.push("Maintainance status is requried");

    if (errorMessage.length > 0) {
      console.error("validation errors: ", errorMessage);
      return res.status(400).send(`invalidRequest: ${errorMessage}`);
    }

    let room = await dbContext.Room.findOne({ roomNumber: request.roomNumber });
    if (room) {
      return res
        .status(400)
        .send(`invalidRequest: Room ${request.roomNumber} already exists`);
    }

    request.createdAt = Date.now();
    request.updatedAt = Date.now();

    var reservation = new dbContext.Room(request);
    reservation.save();
    return res
      .status(200)
      .send({ success: true, message: "Room created successfully" });
  } catch (ex) {
    console.log("Error occurred while creating room.", ex);
    return res.status(500).send({ error: ex });
  }
};

exports.updateRoom = async (req, res, next) => {
  try {
    var request = req.body;
    request.updatedAt = Date.now();
    let result = await dbContext.Room.updateOne(
      { _id: request.roomId
        //roomNumber: request.roomNumber 
      },
      request
    );
    if (result.modifiedCount === 0) {
      return res
        .status(400)
        .send(
          `Invalid request. No record found for updated with provided roomId and room number: ${request.roomNumber}`
        );
    } else console.info("Room updated successfully!");
    return res
      .status(200)
      .send({ success: true, message: "Updated successfully" });
  } catch (ex) {
    console.error("Error occurred while updating room.");
    return res
      .status(500)
      .send({ error: ex, message: "Error occurred during process" });
  }
};

exports.getRoomById = async (req, res, next) => {
  try {
    var result = await dbContext.Room.findById(req.query.id);
    return res.status(200).send(result);
  } catch (ex) {
    console.error("Error occurred while getting room!", ex);
    return res
      .status(500)
      .send({ error: ex, message: "Error occurred during process" });
  }
};

exports.getRooms = async (req, res, next) => {
  try {
    var result = await dbContext.Room.find(req.body)
      .skip((req.query.pageNo - 1) * req.query.pageSize)
      .limit(req.query.pageSize);
    return res.status(200).send(result.map(this.mapUiResponse));
  } catch (ex) {
    console.error("Error occurred while getting room!", ex);
    return res
      .status(500)
      .send({ error: ex, message: "Error occurred during process" });
  }
};

exports.mapUiResponse = (room) => {
  return {
    id: room._id,
    roomNumber: room.roomNumber,
    occupancyStatus: room.occupancyStatus,
    maintainanceStatus: room.maintainanceStatus,
    lastCleanedAt: room.lastCleanedAt,
    pricePerDay: room.pricePerDay
  };
};