const mongoose = require('mongoose'); //library to create a MongoDB schema.

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

//defines the datatype and structure for user
const CustomSchema = new Schema(
  {
    meta: {
      isDeleted: { type: Boolean, default: false },
    },
    customerFullName: String,
    customerContact: {
      phone: String,
      email: String, //optional
      address: String, //optional
      emergencyContact: {
        //optional
        name: String,
        phone: String,
      },
    },
    numberOfIndividuals: Number, // How many people?
    checkInDate: { type: Date, default: Date.now }, //required
    checkOutDate: { type: Date, default: null },
    billing: {
      orders: [
        {
          menuId: {
            type: Schema.Types.ObjectId,
            ref: "MenuItem",
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
          qty: {
            type: Number,
            required: true,
            min: 1,
          },
        },
      ],
      discountPercentage: Number,
      taxPercentage: Number,
      totalAmount: Number, //Sum(orders.amount)
      totalPayableAmount: Number, //totalAmount - discount + tax
    },
    rooms: [{ type: ObjectId, ref: "Room" }],
    status: Number, //Booked, CheckedIn (update check in date), CheckedOut(update check out time), Closed, Canceled
    paymentStatus: Number, //Unpaid, PartiallyPaid, Paid
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
  },
  { timestamps: true }
);


CustomSchema.methods.calculateTotalAmount = ()=> {
    let totalOrderAmt = this.billing.orders.reduce(
        (a,o)=> a + o.amount, 0
    );
    this.billing.totalAmount = totalOrderAmt;

    let discount = (totalOrderAmt / 100) * this.billing.discountPercentage;
    let tax = (totalOrderAmt / 100) * this.billing.taxPercentage;

    this.billing.totalPayableAmount = totalOrderAmt - discount + tax;
  };

module.exports = mongoose.model('Reservation', CustomSchema);