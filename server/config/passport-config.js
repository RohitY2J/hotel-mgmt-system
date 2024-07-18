const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const dbContext = require('../model');

passport.use('local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    let user = await dbContext.User.findOne({ email: email });
    if (!user || !user.validatePassword(password)) {
      return done(null, false, { message: 'Incorrect email or password' });
    }

    return done(null, user);
  }
  catch (err) {
    return done(err);
  }
}))


