const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
// const passportLocalMongoose = require('passport-local-mongoose');


const UserSchema = new mongoose.Schema({
  // userName: { type: String, unique: true },
  email: { type: String, unique: true },
  password: {type: String},
  trackedLocations: {type: Array},
  sendEmail: {type: Boolean, default: false}
});

// Password hash middleware.

UserSchema.pre("save", function save(next) {
  console.log(`attempting`)
  const user = this;
  console.log(`user schema save: ${user}`)
  if (!user.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      console.log(`hashing and next step`)
      user.password = hash;
      next();
    });
  });
});

// Helper method for validating user's password.

UserSchema.methods.comparePassword = function comparePassword(
  candidatePassword,
  cb
) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

module.exports = mongoose.model("User", UserSchema);
