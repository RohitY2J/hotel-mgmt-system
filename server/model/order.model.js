const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for an order
const OrderSchema = new Schema({
  tableNumber: {
    type: Schema.Types.ObjectId,
    ref: "Table",
    required: true,
  },
  customerName: {
    type: String
  },
  discountType:{
    type: Number,
    default: 0
  },
  taxType: {
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
  status: {type: Number, required: true}, // 0-pending, 1-served, 2-cancelled
  orders: [
    {
      menuId: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      qty: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export the model
module.exports = mongoose.model('Order', OrderSchema);
