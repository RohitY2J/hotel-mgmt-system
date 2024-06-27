const mongoose = require('mongoose'); //library to create a MongoDB schema.

const Schema = mongoose.Schema;

const CustomSchema = new Schema(
    {
        _id: ObjectId,
        taskName: String,
        description: String,
        assignedTo: ObjectId, // References employee profile or team
        assignedBy: ObjectId, // Manager assigning the task
        status: String, // e.g., "Pending", "In Progress", "Completed"
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }, { timestamps: true });

module.exports = mongoose.model('Attendance', CustomSchema);
      