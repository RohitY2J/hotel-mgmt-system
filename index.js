const express = require('express');
const path = require('path');
const app = express();
const port = 8000;


const mongoose = require('mongoose')

// • Declare variables
const MONGO_DB = 'mongodb://127.0.0.1/hotel-mgmt-app'
//const PORT = 8000


try {

  // • Connect to MongoDB database. Please be sure you have started MongoDB
  // services before running application and replace `MEAN-Template-app` with your
  // database's name.
  mongoose.connect(MONGO_DB)
    .catch(() => { console.log('Could not connect to mongodb'); })

  // • `/dist` is default file output of ng build command. You can change
  // that on `angular-cli.json` config file but don't forget to change below line
  // too or server will not be able to locate our front-end part of application.
  console.log(__dirname);
  //app.use(express.static(path.join(__dirname, 'dist')))

  // Serve Angular app
  app.use(express.static(path.join(__dirname, 'dist/browser')));

// app.listen(port, () => {
// console.log(`Server is running on port ${port}`);
// });



  // • This is a special method called `middleware`. Every request will be
  // executed on each request. If you want to exclude a specific route to make it
  // not enter on this middleware, simply declare that route before this function
  app.use('/', function (req, res, next) {
    // • Implement your logic here.
    console.log('Time:', Date.now())
    next()
  })

  // • We call use() on the Express application to add the Router to handle path,
  // specifying an URL path on first parameter '/api/example'.
  app.use('/api/example', require('./server/routes/example-routes'))

  // • Every other route that starts with `api/` but not declared above will
  // return `not-found` status. Apply your `not-found` format here.
  app.get('/api/*', (req, res) => {
    res.send({
      message: 'Endpoint not found',
      type: 'error'
    })
  })

  // • Every other route not declared above will redirect us to Angular view
  // called `index.html`. Be sure you have builded and created output files from
  // angular app.
//   app.get('*', (req, res) => {
//     console.log(req.url)
//     res.sendFile(path.join(__dirname, 'dist/index.html'))
//   })

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/browser/index.html'));
});

  // • Start listening on port {{PORT}} for requests.
  app.listen(port, () => console.log(`Application started successfully on port: ${port}!`))
} 
catch (error) {
  console.log(error)
}