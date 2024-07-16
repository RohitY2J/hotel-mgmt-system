const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for an order
const TableSchema = new Schema({
  tableNumber: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String, 
    required: true,
    trim: true
  },
  status: {type: Number, required: true}, // 0-available, 1-occupied
  capacity: {type: Number, required: true},
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export the model
module.exports = mongoose.model('Table', TableSchema);
