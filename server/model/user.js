const crypto = require('crypto'); //for cryptographic functions.
const mongoose = require('mongoose'); //library to create a MongoDB schema.

const Schema = mongoose.Schema;

//defines the datatype and structure for user
const CustomSchema = new Schema({
  meta: {
    isDeleted: {type: Boolean, default: false}
  },
  userName: String,
  fullName: String,
  email: String,
  phNum: String,
  profilePic: String,
  roleID: {type: Number, default: 0}, // 0: Waiter, 1: Admin
  hash: String, // used to store the encrypted passwords
  salt: String, // used to store the encrypted passwords
  clientId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref:"Client",
    required: true
  }
}, {timestamps: true});

/**
 * Encrypt password using pbkdf2
 *
 * @param {string} password - the password
 */
CustomSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512')
    .toString('hex');
};

/**
 * password are not stored in plain text, so have to use PBKDF2 to verify password
 *
 * @param {string} password - the password
 * @returns {boolean} return if the password is correct
 */
CustomSchema.methods.validatePassword = function(password) {
  if (this.salt) { // salt
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512')
      .toString('hex');
    return this.hash === hash;
  }
  else {
    return false;
  }
};


CustomSchema.methods.userSimplified = function(){
  return {
    _id: this._id,
    email: this.email,
    userName: this.userName,
    fullName: this.fullName,
    roleID: this.roleID,
    profilePic: this.profilePic || '/static/img/profile.png',
    clientId: this.clientId
  };
};

module.exports = mongoose.model('User', CustomSchema);