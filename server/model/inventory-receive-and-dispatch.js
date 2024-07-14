const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InventoryReceiveAndDispatchSchema = new Schema({

    inventoryItemId: {type: String, required: true},
    itemName: {type: String, required: true},
    actionType: {type: Number, required: true}, //0 - Receive, 1 - Dispatch
    count: {type: Number, required: true},
    //meta
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    isDeleted: { type: Boolean },
    createdBy: { type: String, required: true },
    lastUpdatedBy: { type: String, required: true },
});

// Middleware to update the `updatedAt` field on update
InventoryReceiveAndDispatchSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('InventoryReceiveAndDispatch', InventoryReceiveAndDispatchSchema);