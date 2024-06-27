const mongoose = require('mongoose'); //library to create a MongoDB schema.

const Schema = mongoose.Schema;

const CustomSchema = new Schema({
    meta: {
        isDeleted: { type: Boolean, default: false }
    },
        _id: ObjectId,
        roleName: String,
        permissions: [String], // Array of permissions
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Role', CustomSchema);