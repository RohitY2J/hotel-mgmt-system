const mongoose = require('mongoose'); //library to create a MongoDB schema.

const Schema = mongoose.Schema;

//defines the datatype and structure for user
const ClientSchema = new Schema({
  meta: {
    isDeleted: {type: Boolean, default: false}
  },
  clientName: {type: String}
}, {timestamps: true});

module.exports = mongoose.model('Client', ClientSchema);
