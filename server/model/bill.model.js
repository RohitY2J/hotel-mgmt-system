const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for an bill
const BillSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  discountType:{
    type: Number,
    default: 0
  },
  discountAmt: {
    type: Number,
    default: 0
  },
  taxAmt: {
    type: Number,
    default: 0
  },
  discountPercent:{
    type: Number,
    default: 0
  },
  taxPercent: {
    type: Number,
    default: 0
  },
  grandTotal:{
    type: Number,
    default: 0
  },//after discount and tax
  paymentType: {
    type: Number, // 0-cash, 1-online
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref:"Client",
    required: true
  }
});

// Export the model
module.exports = mongoose.model('Bill', BillSchema);
