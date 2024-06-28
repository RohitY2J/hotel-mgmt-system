const mongoose = require('mongoose'); //library to create a MongoDB schema.

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const CustomSchema = new Schema(
    {
        _id: ObjectId,
        date: Date,
        shiftStart: Date,
        shiftEnd: Date,
        employeeId: ObjectId, // References employee profile
        status: String, // e.g., "Scheduled", "Cancelled", "Completed"
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      }, { timestamps: true });

module.exports = mongoose.model('ShiftSchedule', CustomSchema);
      