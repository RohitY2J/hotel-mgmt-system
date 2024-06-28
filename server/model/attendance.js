const mongoose = require('mongoose'); //library to create a MongoDB schema.

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const CustomSchema = new Schema(
    {
        _id: ObjectId,
        employeeId: ObjectId, // References employee profile
        date: Date,
        lateCheckInReason: String,
        earlyPunchOutReason: String,
        checkInIpAddress: String, // Ip of the checinNetwork
        checkInOutAddress: String,
        checkIn: Date,
        checkOut: Date,
        status: String, // e.g., "Present", "Absent", "On Leave"
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      }, { timestamps: true });

module.exports = mongoose.model('Attendance', CustomSchema);
      