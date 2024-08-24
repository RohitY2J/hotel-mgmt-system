const dbContext = require("../model");
const roomService = require("./roomService");
const globalConstants = require("../constants/globalConstants");
const conversion = require("../helper/conversion");

exports.createReservation = async (req, res, next) => {
  try {
    var request = req.body;
    var errorMessage = [];
    if (!request.customerFullName)
      errorMessage.push("Customer fullname is required");
    if (!request.customerContact?.phone)
      errorMessage.push("Customer phone number is required");
    if (!request.checkInDate) errorMessage.push("CheckIn date is required");
    if (!req.clientId) errorMessage.push("Client Id is required");

    if (errorMessage.length > 0) {
      console.error("validation errors: ", errorMessage);
      return res.status(400).send(`invalidRequest: ${errorMessage}`);
    }
    let roomIds = [];
    request.rooms.map(x => roomIds.push(x.id));

    await dbContext.Room.updateMany({ _id: { $in: roomIds } }, { occupancyStatus: globalConstants.RoomStatus.Occupied });

    request.createdAt = Date.now();
    request.updatedAt = Date.now();

    var reservation = new dbContext.Reservation(request);
    reservation.clientId = conversion.ToObjectId(req.clientId);
    reservation.save();
    return res
      .status(200)
      .send({ success: true, message: "Reservation created successfully" });
  } catch (ex) {
    console.error("Error creating room: ", ex);
    return res.status(500).send({ error: ex });
  }
};

exports.addOrdersForCustomer = async (req, res, nex) => {
  try {
    var request = req.body;

    var reservationToUpdate = await dbContext.Reservation.findById(request.id);
    if (!reservationToUpdate)
      return res.status(400).send("No reservation found.");

    request.orders.forEach(order => {
      let existingOrders = reservationToUpdate.billing.orders.find(x => x.menuId == order.menuId);
      if (existingOrders)
        existingOrders.qty += order.qty;
      else reservationToUpdate.billing.orders.push(order);
    });

    let result = await dbContext.Reservation.updateOne(
      { _id: request.id },
      reservationToUpdate
    );


    return res.status(200).send({ message: "Orders added successfully", isSuccess: true });
  } catch (ex) {
    console.error("Error updating room: ", ex);
    return res.status(500).send({ error: ex });
  }
};

exports.updateReservation = async (req, res, next) => {
  try {
    var request = req.body;


    let reservationUpdateRequest = {};
    if (request.status > -1) reservationUpdateRequest.status = request.status;
    if (request.paymentStatus > -1) reservationUpdateRequest.paymentStatus = request.paymentStatus;
    if (request.billing) reservationUpdateRequest.billing = request.billing;
    if (request.checkInDate) reservationUpdateRequest.checkInDate = request.checkInDate;
    if (request.checkOutDate) reservationUpdateRequest.checkOutDate = request.checkOutDate;
    if (request.numberOfIndividuals) reservationUpdateRequest.numberOfIndividuals = request.numberOfIndividuals;
    if (request.customerFullName) reservationUpdateRequest.customerFullName = request.customerFullName;
    if (request.customerContact) reservationUpdateRequest.customerContact = request.customerContact;
    reservationUpdateRequest.updatedAt = Date.now();

    if (request.checkInDate > request.checkOutDate)
      return res
        .status(400)
        .send(`Checkout date cannot be earlier than check in date`);
    let result = await dbContext.Reservation.updateOne(
      { _id: request.id },
      reservationUpdateRequest
    );



    if (result.modifiedCount === 0)
      return res
        .status(400)
        .send(`Invalid request. No record found for updated.`);


    let roomIds = [];
    if (request.rooms) {
      request.rooms.map(x => roomIds.push(x.id));
    }

    let roomsUpdateRequest = {};

    if (request.status === globalConstants.ReservationStatus.Closed) {
      roomsUpdateRequest.occupancyStatus = globalConstants.RoomStatus.Available;
      roomsUpdateRequest.maintainnanceStatus = globalConstants.MaintainanceStatus.Dirty;
    }
    if (request.status === globalConstants.ReservationStatus.Canceled) {
      roomsUpdateRequest.occupancyStatus = globalConstants.RoomStatus.Available;
    }

    await dbContext.Room.updateMany({ _id: { $in: roomIds } }, roomsUpdateRequest);
    return res
      .status(200)
      .send({ success: true, message: "Updated successfully" });
  } catch (ex) {
    console.error("Error updating item: ", ex);
    return res.status(500).send({ error: ex });
  }
};

exports.getReservationById = async (req, res, next) => {
  try {
    var result = await dbContext.Reservation.findById(req.query.id)
      .populate({
        path: "rooms",
        select:
          "_id roomNumber occupancyStatus maintainanceStatus lastCleanedAt pricePerDay",
      });
    return res.status(200).send(result);
  } catch (ex) {
    console.error("Error occurred while getting room", ex);
    return res.status(500).send({ error: ex });
  }
};

exports.getCustomerName = async (req, res, next) => {
  try {
    if (!req.clientId) {
      return res.status(422).json({
        success: false,
        msg: 'Client Id is required'
      });
    }

    let filter = { clientId: conversion.ToObjectId(req.clientId) };
    if (req.body.filterValue) {
      filter.customerFullName = { $regex: req.body.filterValue, $options: 'i' };
    }

    const uniqueCustomerNames = await dbContext.Reservation.distinct('customerFullName', filter);
    return res.status(200).json({
      success: true,
      msg: 'customers retrived successfully',
      data: uniqueCustomerNames
    });
  }
  catch (err) {
    return res.status(500).json({
      success: false,
      msg: "Error encountered:" + err.message
    });
  }
}

exports.getReservations = async (req, res, next) => {
  try {

    if (!req.clientId) {
      return res.status(422).json({
        success: false,
        msg: 'Client Id is required'
      });
    }

    filter = { clientId: conversion.ToObjectId(req.clientId) };

    if (req.body.paymentStatus) {
      filter.paymentStatus = req.body.paymentStatus;
    }

    if (req.body.status) {
      filter.status = req.body.status;
    }

    if (req.body.customerFullName) {
      filter.customerFullName = req.body.customerFullName;
    }

    var result = await dbContext.Reservation.find(filter)
      .populate({
        path: "rooms",
        select:
          "_id roomNumber occupancyStatus maintainanceStatus lastCleanedAt pricePerDay",
      })
      .sort({ checkInDate: -1 })
      .skip((req.query.pageNo - 1) * req.query.pageSize)
      .limit(req.query.pageSize);
    return res.status(200).send(result.map(this.mapUiResponse));
  } catch (ex) {
    console.error("Error occurred while getting room!", ex);
    return res.status(500).send({ error: ex });
  }
};

exports.mapUiResponse = (reservation) => {
  return {
    id: reservation._id,
    customerContact: {
      phone: reservation.customerContact.phone,
      email: reservation.customerContact.email,
      address: reservation.customerContact.address,
    },
    customerFullName: reservation.customerFullName,
    numberOfIndividuals: reservation.numberOfIndividuals,
    checkInDate: reservation.checkInDate,
    checkOutDate: reservation.checkOutDate,
    rooms: reservation.rooms,
    status: reservation.status,
    paymentStatus: reservation.paymentStatus,
    createdAt: reservation.createdAt,
    billing: reservation.billing
  };
};
