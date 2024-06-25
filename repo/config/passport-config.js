passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email , password, done) => {
    try{
      let user = await User.findOne({ email });

      if (!user || !user.validatePassword(password)) {
        return done(null, false, { message: 'Incorrect email or password' });
      }

      return done(null, user);
    }
    catch(err){
      return done(err);
    }
  }))


  passport.serializeUser((user, done) => {
    done(null, user.id); // Serialize user id into the session
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id); // Deserialize user id from the session
      done(null, user);
    } catch (err) {
      done(err);
    }
  });