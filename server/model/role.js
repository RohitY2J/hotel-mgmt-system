const mongoose = require('mongoose'); //library to create a MongoDB schema.

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

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