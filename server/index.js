const express = require('express');
const mongoose = require('mongoose')
const path = require('path');
const cors = require('cors');
const cookieSession = require('cookie-session');
const passport = require("passport");
const bodyParser = require("body-parser");

const app = express();
const port = 8000;
const MONGO_DB = 'mongodb://127.0.0.1/hotel-mgmt-app'


try {

  mongoose.connect(MONGO_DB)
    .catch(() => { console.log('Could not connect to mongodb'); })

  /** ==========serve static page build from the location =======*/
  
  app.use(express.static(path.join(__dirname, '../dist/browser')));
  console.log(__dirname);

  /** ============ */

  /** === defining cors for running angular and node server separately. */
  
  const corsOptions = {
    origin: 'http://localhost:4200', // Allow only this origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
  
  app.use(cors(corsOptions));

  /** ============= */


  /** ============== Defining passport for authentication and session management **/
  app.use(cookieSession({
    name: 'hotel-mgmt-session',
    resave: false, // resave cookies even if nothing changed
    saveUninitialized: false,
    //keys: [process.env.COOKIE_KEY],
    keys: ["?2!>-/zJ{8okCeMS-M#H=%kjGv=40<biJrCm_Q|qk^<{(nrM_'(hj9!(Jk4e(*$"],
    maxAge: 100 * 24 * 60 * 60 * 1000 // 100 days
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(function (user, cb) {
    cb(null, user);
  });

  require('./config/passport-config');

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  }));

  app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.user });
  });

  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  }

  /** ======================================================== */

  /**========= body parser middleware */
  app.use(bodyParser.json());
  /**===================== **/

  // • This is a special method called `middleware`. Every request will be
  // executed on each request. If you want to exclude a specific route to make it
  // not enter on this middleware, simply declare that route before this function
  app.use('/', function (req, res, next) {
    // • Implement your logic here.
    console.log('Time:', Date.now())
    next()
  })

  app.use('/api', require('./routes/api'))

  app.get('/api/*', (req, res) => {
    res.send({
      message: 'Endpoint not found',
      type: 'error'
    })
  })

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/browser/index.html'));
  });

  // • Start listening on port {{PORT}} for requests.
  app.listen(port, () => console.log(`Application started successfully on port: ${port}!`))
}
catch (error) {
  console.log(error)
}