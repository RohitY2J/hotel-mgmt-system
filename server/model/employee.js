const mongoose = require('mongoose'); //library to create a MongoDB schema.

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

//defines the datatype and structure for user
const CustomSchema = new Schema({
    meta: {
        isDeleted: { type: Boolean, default: false }
    },
    employeeId: String,
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    contactInfo: {
        phone: String,
        email: String,
        address: String,
        emergencyContact: {
            name: String,
            phone: String
        }
    },
    documents: [
        {
            documentType: String, //Profile Pic, Citizenship, liscensce
            fileObject: String,
        }
    ],
    roles: [ObjectId], // multiple roles
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

}, { timestamps: true });


module.exports = mongoose.model('Employee', CustomSchema);