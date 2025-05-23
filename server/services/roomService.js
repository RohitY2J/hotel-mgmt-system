const dbContext = require("../model");
const conversion = require("../helper/conversion");
const globalConstants = require("../constants/globalConstants");


exports.createRoom = async (req, res, next) => {
  try {


    var errorMessage = [];
    let request = req.body;
    if (!request.roomNumber) errorMessage.push("Room number is required");
    // if (!request.occupancyStatus)
    //   errorMessage.push("Occupancy status is requried");
    if (!request.maintainanceStatus)
      errorMessage.push("Maintainance status is requried");
    if (!req.clientId) errorMessage.push("Client Id is required");

    if (errorMessage.length > 0) {
      console.error("validation errors: ", errorMessage);
      return res.status(400).send(`invalidRequest: ${errorMessage}`);
    }

    //set initial room status to available
    request.occupancyStatus = globalConstants.RoomStatus.Available;
    let existingRoom = await dbContext.Room.findOne({ roomNumber: request.roomNumber, clientId: conversion.ToObjectId(req.clientId) });
    if (existingRoom) {
      return res
        .status(400)
        .send(`invalidRequest: Room ${request.roomNumber} already exists`);
    }

    request.createdAt = Date.now();
    request.updatedAt = Date.now();

    var room = new dbContext.Room(request);
    room.clientId = conversion.ToObjectId(req.clientId);
    await room.save();
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

    if (!req.clientId) {
      return res.status(422).json({
        success: false,
        msg: 'Client Id is required'
      });
    }

    let request = {clientId: conversion.ToObjectId(req.clientId)};
    if(req.body.roomNumber){
      request.roomNumber = req.body.roomNumber;
    }

    if(req.body.maintainanceStatus){
      request.maintainanceStatus = req.body.maintainanceStatus;
    }

    if (Number.isFinite(req.body.occupancyStatus)) {
      request.occupancyStatus = req.body.occupancyStatus;
    }

    var result = await dbContext.Room.find(request)
      .sort({ roomNumber: 1 }) 
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
    pricePerDay: room.pricePerDay,
    maintainanceStatus: room.maintainanceStatus,
    lastCleanedAt: room.lastCleanedAt,
    pricePerDay: room.pricePerDay
  };
};