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

exports.ValidateStringDate = (dateStr) => {
    const date = dayjs(dateStr);

    if (!date.isValid()) {
        return { isValid: false, formattedDate: null };
    }

    // Format the date into a specific string format, e.g., YYYY-MM-DD
    const formattedDate = date.format('YYYY-DD-MM');
    
    return { isValid: true, formattedDate };
}