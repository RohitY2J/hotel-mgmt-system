const mongoose = require('mongoose');

const EmployeeDailyActivitySchema = new mongoose.Schema({
    date: String,
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    attendanceStatus: Number, //0: "Scheduled", 1: "Present", 2: "Absent", 3: "On Leave"
    shift: Number, //0:"Normal", 1:"Evening", 2:"Morning"
    shiftStart: Date,
    shiftEnd: Date,
    shiftStatus: Number,   // 0:"Scheduled", 1:"Cancelled", 2:"Completed"
    tasks: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    clientId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref:"Client",
      required: true
    }
});

const EmployeeDailyActivity = mongoose.model('EmployeeDailyActivity', EmployeeDailyActivitySchema);

module.exports = EmployeeDailyActivity;
