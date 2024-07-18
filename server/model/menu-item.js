const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

// MenuItem Schema
const MenuItemSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: false },
    available: { type: Boolean, default: true },
    availableQuantity: {type: Number},
    inventoryId: { type: ObjectId, ref: 'Stocks' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    file: {type: String},
    clientId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref:"Client",
      required: true
    }
});

// Middleware to update the `updatedAt` field on update
MenuItemSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);