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
const http = require('http');
const environment = require('../env/nodeEnv');

const app = express();
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});

const port = environment.serverPort;
const MONGO_DB = environment.databaseURL;


try {

  //#region Mongoose Connect
  mongoose.connect(MONGO_DB)
    .then(async () => {
      console.log('Mongoose connected successfully');
      // Run the attendance creation function immediately
      // await businessLogic.EmployeeDailyActivityLogic.createDailyActivityRecord();

      // // runs every 6 hour
      // cron.schedule('0 */6 * * *', () => {
      //   console.log('Running daily attendance creation script at 12 AM');
      //   businessLogic.EmployeeDailyActivityLogic.createDailyActivityRecord();
      // });
    })
    .catch((error) => {
      console.log('Could not connect to mongodb');
    })
  //#endregion

  //#region SOCKET.IO
// Socket.IO connection
  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  app.set('socketio', io);

  /** ==========serve static page build from the location =======*/
  //endregion

  //#region FILE_UPLOAD
  app.use(express.static(path.join(__dirname, '../dist/browser')));

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  console.log(__dirname);

  //#endregion

  //#region CORS
  /** === defining cors for running angular and node server separately. */

  const corsOptions = {
    origin: "http://localhost:4200", // Allow only this origin
    credentials: true
  };
  app.use(cors(corsOptions));

  /** ============= */
  //#endregion

  //#region SESSION_AND_AUTH
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

  //#endregion

  //#region ENDPOINTS
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
    res.send({isAuthenticated: req.isAuthenticated()});
  });

  app.get("/api/getUserDetails", (req, res) => {
    res.send(req.user);
  })

  app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', {user: req.user});
  });


  function isAuthenticated(req, res, next) {
    if (req.originalUrl === '/api/login' || req.isAuthenticated()) {
      return next();
    }
    res.status(401).send('Un-authorized user.');
  }

  //#endregion

  //#region SERVER and MIDDLEWARE
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
    res.send({isAuthenticated: req.isAuthenticated()});
  });

  app.get("/api/getUserDetails", (req, res) => {
    res.send(req.user);
  })

  app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', {user: req.user});
  });

  //#endregion

} catch (error) {
  console.log(error)
}
