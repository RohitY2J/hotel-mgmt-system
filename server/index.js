const express = require('express');
const mongoose = require('mongoose')
const path = require('path');
const cors = require('cors');
const cookieSession = require('cookie-session');
const passport = require("passport");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const businessLogic = require("./business-logic");
const cron = require("node-cron");

const app = express();
const port = 8000;
const MONGO_DB = 'mongodb://127.0.0.1/hotel-mgmt-app'


try {

  mongoose.connect(MONGO_DB)
    .then(async () => {
      console.log('Mongoose connected successfully');
      // Run the attendance creation function immediately
      await businessLogic.EmployeeDailyActivityLogic.createDailyActivityRecord();

      // runs every 6 hour
      cron.schedule('0 */6 * * *', () => {
        console.log('Running daily attendance creation script at 12 AM');
        businessLogic.EmployeeDailyActivityLogic.createDailyActivityRecord();
      });
    })
    .catch((error) => { 
      console.log('Could not connect to mongodb'); 
    })

  /** ==========serve static page build from the location =======*/

  app.use(express.static(path.join(__dirname, '../dist/browser')));

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  console.log(__dirname);

  /** ============ */

  /** === defining cors for running angular and node server separately. */

  const corsOptions = {
    origin: "http://localhost:4200", // Allow only this origin
    credentials: true
  };
  app.use(cors(corsOptions));

  /** ============= */


  /** ============== Defining passport for authentication and session management **/
  app.use(cookieSession({
    name: 'hotel-mgmt-session',
    keys: ["?2!>-/zJ{8okCeMS-M#H=%kjGv=40<biJrCm_Q|qk^<{(nrM_'(hj9!(Jk4e(*$"],
    maxAge: 100 * 24 * 60 * 60 * 1000, // 100 days,
    resave: false, // Avoids resaving sessions that haven't changed
    saveUninitialized: true, // Saves new sessions
  }));

  /**========= body parser middleware */
  app.use(bodyParser.json());
  /**===================== **/
  
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  require('./config/passport-config');

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/admin/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  }));
  
  app.get("/api/logout", (req, res) => {
    req.logOut();
    res.send({message: "Log out success!"});
  });

  app.get("/api/isAuthenticated", (req, res) => {
    res.send({ isAuthenticated: req.isAuthenticated() });
  });

  app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.user });
  });
  

  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    // res.redirect('/login');
  }

  /** ======================================================== */

  /**========= body parser middleware */
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
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

  app.listen(port, () => console.log(`Application started successfully on port: ${port}!`))
}
catch (error) {
  console.log(error)
}