const express = require('express');
const mongoose = require('mongoose')
const path = require('path');
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;


const app = express();
const port = 8000;
const User = require('./repo/Model/user');

// • Declare variables
const MONGO_DB = 'mongodb://127.0.0.1/hotel-mgmt-app'
//const PORT = 8000


try {

  mongoose.connect(MONGO_DB)
    .catch(() => { console.log('Could not connect to mongodb'); })

  console.log(__dirname);
  //serve static page build from the location 
  app.use(express.static(path.join(__dirname, 'dist/browser')));


  /** ============== Defining passport for authentication and session management **/
  app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie:{
      maxAge: 2 * 60 * 60 * 1000 // 2 hour
    }
  }))

  app.use(passport.initialize());
  app.use(passport.session());

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

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true // Enable flash messages (optional)
  }));

  // Example route requiring authentication
  app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.user });
  });

  // Middleware to check if user is authenticated
  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  }

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

  /** ======================================================== */

  // • This is a special method called `middleware`. Every request will be
  // executed on each request. If you want to exclude a specific route to make it
  // not enter on this middleware, simply declare that route before this function
  app.use('/', function (req, res, next) {
    // • Implement your logic here.
    console.log('Time:', Date.now())
    next()
  })

  app.use('/api/example', require('./server/routes/example-routes'))

  app.get('/api/*', (req, res) => {
    res.send({
      message: 'Endpoint not found',
      type: 'error'
    })
  })

  app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist/browser/index.html'));
  });

  // • Start listening on port {{PORT}} for requests.
  app.listen(port, () => console.log(`Application started successfully on port: ${port}!`))
} 
catch (error) {
  console.log(error)
}