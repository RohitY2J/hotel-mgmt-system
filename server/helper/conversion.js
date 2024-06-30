const mongoose = require('mongoose'); //library to create a MongoDB schema.

const ObjectId = mongoose.Types.ObjectId;


exports.ToObjectId = (id) => {
    return new ObjectId(id);
}