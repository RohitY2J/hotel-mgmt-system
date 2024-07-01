const mongoose = require('mongoose'); //library to create a MongoDB schema.
const dayjs = require('dayjs');

const ObjectId = mongoose.Types.ObjectId;


exports.ToObjectId = (id) => {
    return new ObjectId(id);
}

exports.DateToString = (date) =>{
    if (!(date instanceof Date)) {
        throw new Error('Invalid date object');
      }
    return dayjs(date).format('YYYY-MM-DD');
}