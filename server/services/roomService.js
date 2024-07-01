const { OperationCanceledException } = require("typescript");
const dbContext = require("../model");

const mongoose = require('mongoose'); 

exports.createRoom = async (req, res, next) => {
  try {
    var errorMessage = [];
    let request = req.body;
    if (!request.roomNumber) errorMessage.push("Room number is required");
    if (!request.occupancyStatus) errorMessage.push("Occupancy status is requried");
    if (!request.maintainanceStatus)
      errorMessage.push("Maintainance status is requried");

    let room = await dbContext.Room.findOne({ roomNumber: request.roomNumber });
    console.log(room);
    if (room) errorMessage.push("Room number already exists");

    console.log(errorMessage);
    if (errorMessage.length > 0)
      throw new OperationCanceledException(
        "One or more error occurred",
        errorMessage
      );

      request.createdAt = Date.now();
      request.updatedAt = Date.now();

    var reservation = new dbContext.Room(request);
    reservation.save();
    res.status(200).json({success: true, message: 'Room created successfully'});
  } catch (ex) {
    console.log("Error occurred while creating room.", ex);
    res.send({error: ex})
  }
};

exports.updateRoom = async (req, res) => {
  try {
    var request = req.body;
    request.updatedAt = Date.now();
    c
    let result = await dbContext.Room.updateOne({_id: new mongoose.Schema.Types.ObjectId(req.query.id)}, request);
    if (result.modifiedCount === 0) console.warn("No documents updated");
    else console.info("Room updated successfully!");
    return result;
  } catch (ex) {
    console.error("Error occurred while updating room.")
    res.send({error: ex});
  }
};

exports.getRoomById = async (req, res) => {
  try {
    var result = await dbContext.Room.findOne({_id: new mongoose.Schema.Types.ObjectId(req.query.id)});
    return result;
  } catch (ex) {
    console.error("Error occurred while getting room!", ex);
    res.send({error: ex})
  }
};

exports.getRooms = async (req) => {
  try {
    var result = await dbContext.Room.find(req.body);
    return result;
  } catch (ex) {
    console.error("Error occurred while getting room!", ex);
    res.send({error: ex})
  }
};