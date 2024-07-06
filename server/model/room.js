const mongoose = require('mongoose'); //library to create a MongoDB schema.

const Schema = mongoose.Schema;

const CustomSchema = new Schema({
    meta: {
        isDeleted: { type: Boolean, default: false }
    },
    roomNumber: String,
    occupancyStatus: Number, //Booked, CheckedIn, Available
    maintainanceStatus: Number, //Dirty, Clean
    lastCleanedAt: { type: Date, default: null },
    pricePerDay: Number,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Room', CustomSchema);