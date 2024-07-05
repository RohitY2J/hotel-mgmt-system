const { OperationCanceledException } = require("typescript");
const dbContext = require("../model");
const roomService = require("./roomService");

exports.createReservation = async (req, res, next) => {
  try {
    var request = req.body;
    var errorMessage = [];
    if (!request.customerFullName)
      errorMessage.push("Customer fullname is required");
    if (!request.customerContact?.phone)
      errorMessage.push("Customer phone number is requried");
    if (!request.checkInDate) errorMessage.push("CheckIn date is requried");

    if (errorMessage.length > 0) {
      console.error("validation errors: ", errorMessage);
      return res.status(400).send(`invalidRequest: ${errorMessage}`);
    }
    let roomIds = [];
    request.rooms.map(x=>roomIds.push(x));
    
    await dbContext.Room.updateMany({ _id: { $in: roomIds } }, {occupancyStatus: "Occupied"});

    request.createdAt = Date.now();
    request.updatedAt = Date.now();

    var reservation = new dbContext.Reservation(request);
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
    
    reservationToUpdate.billing.orders.push(request.orders);

    console.log(reservationToUpdate.billing.orders);

    let result = await dbContext.Reservation.updateOne(
      { _id: request.id },
      reservationToUpdate
    );

    return res.status(200).send("Orders added successfully");
  } catch (ex) {
    console.error("Error updating room: ", ex);
    return res.status(500).send({ error: ex });
  }
};

exports.updateReservation = async (req, res, next) => {
  try {
    var request = req.body;
    request.updatedAt = Date.now();
    let result = await dbContext.Reservation.updateOne(
      { _id: request.id },
      request
    );
    if (result.modifiedCount === 0)
      return res
        .status(400)
        .send(`Invalid request. No record found for updated.`);
    return res
      .status(200)
      .send({ success: true, message: "Updated successfully" });
  } catch (ex) {
    console.error("Error updating room: ", ex);
    return res.status(500).send({ error: ex });
  }
};

exports.getReservationById = async (req, res, next) => {
  try {
    var result = await dbContext.Reservation.findById(req.query.id);
    return res.status(200).send(result);
  } catch (ex) {
    console.error("Error occurred while getting room", ex);
    return res.status(500).send({ error: ex });
  }
};

exports.getReservations = async (req, res, next) => {
  try {
    var result = await dbContext.Reservation.find(req.body)
      .populate({
        path: "rooms",
        select:
          "_id roomNumber occupancyStatus maintainanceStatus lastCleanedAt",
      })
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
    checkOutDate: reservation.checkInDate,
    rooms: reservation.rooms.map(roomService.mapUiResponse),
    status: reservation.status,
    paymentStatus: reservation.paymentStatus,
    createdAt: reservation.createdAt,
    billing: reservation.billing
  };
};
