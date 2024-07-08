const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InventorySchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  itemType: { type: Number, required: true }, // Kitchen, Maintainance, Customer
  quantityUnitType: { type: Number, required: true }, // Example: Unit, Dozen, ML
  pricePerUnit: { type: Number, required: false },
  availableUnit: { type: Number, required: true },
  isVisibleInMenu: { type: Boolean, required: true }, //Show and link in menu if true
  lastAddedOn: { type: Date, required: true },
  lastAddedUnit: { type: Number, required: true },
  minUnitToShowAlert: { type: Number, required: false }, //idea is if min quantity is reached some kind of alert should be shown
  file: { type: String, required: false },
  //meta
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isDeleted: { type: Boolean },
  createdBy: { type: String, required: true },
  lastUpdatedBy: { type: String, required: true },
});

// Middleware to update the `updatedAt` field on update
InventorySchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Inventory', InventorySchema);