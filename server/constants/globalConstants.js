exports.RoomStatus = Object.freeze({
    Available: 0,
    Booked: 1,
    Occupied: 2,
});

exports.MaintainanceStatus = Object.freeze({
  Dirty: 0,
  Clean: 1,
});

exports.ReservationStatus = Object.freeze({
  Booked: 0,
  CheckedIn: 1,
  Closed: 2,
  Canceled: 3,
});

exports.PaymentStatus = Object.freeze({
  Paid: 0,
  Unpaid: 1,
  PartiallyPaid: 2,
});

exports.InventoryActionType = Object.freeze({
Receive: 0,
Dispatch: 1
});
