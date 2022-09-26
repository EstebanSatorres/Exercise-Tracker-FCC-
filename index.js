// PLEASE READ NOTE BELOW

/*Please be aware that I used Replit, so I couldn't create a .env file. Instead, I used the built-in SECRETS tab to add the variable. Do not surround the values with quotes when using the SECRETS tab.When you are done, connect to the database using the following syntax:
mongoose.connect(<Your URI>, { useNewUrlParser: true, useUnifiedTopology: true});*/

const express = require('express')
const app = express()
const cors = require('cors')

const mongoose = require("mongoose")
const { Schema } = require("mongoose")
const mySecret = process.env['MONGO_URI']
const bodyParser = require("body-parser");

require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

/*    MY CODE STARTS  */
mongoose.connect(mySecret, {useNewUrlParser: true, useUnifiedTopology: true});

//Check MongooseDB status connection. If shows "1" is connected
app.get("/mongo-health", (req,res) => {
  res.json({status: mongoose.connection.readyState})
})

//Middleware to parse POST requests
app.use(bodyParser.urlencoded({extended: false}));

//Define Schemas
const userSchema = new Schema ({
  username: {
    type: String,
    required: true
  },
  log: [{
    date: String,
    duration: Number,
    description: String
  }],
  count: Number
});

// Create Models
const User = mongoose.model("User", userSchema);

app.route("/api/users")
  .post((req, res) => {
    const username = req.body.username;
    const user = new User({username, count: 0})
    user.save((err, data) => {
      if(err) {
        res.json({ error: err })
      }
      res.json(data)
    })
  })
  .get((req, res) => { 
    User.find((err, data) => { /* To get/find all the users */
      if(err) {
        res.json({ error: err })
      }
      res.json(data)
    })
  })

app.post("/api/users/:_id/exercises", (req, res) => {
  //bodyParser will insert those fields (description, duration and date) into the body of the request from the client
  const { description } = req.body;
  const duration = parseInt(req.body.duration); //Convertion to number
  const date = req.body.date ? 
    new Date(req.body.date).toDateString() : 
    new Date().toDateString(); //If date present, retrieve date, otherwise sent actual date
  const id = req.params._id;
  const exercise = { description, duration, date };

  User.findByIdAndUpdate(id, { $push: {log: exercise}, $inc: {count: 1}}, {new: true}, (err, user) => {
    //1st arg: "id" we want to find
    //2nd arg: Objects we want to push to the user ($push). Also "$inc" will increment by 1 count
    //3rd arg: "true" will return the updated doc and "false" will return the old doc
    if(user) {
      const updatedExercise = {username: user.username, ...exercise, _id: id};
      res.json(updatedExercise)
      // console.log("User: "+ user);
      // console.log("Exercise(s): "+user.log);
    }
  })
})

app.get("/api/users/:_id/logs", (req, res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;
  User.findById(id, (req, user) => {
    if(user) {
      if(from || to || limit){
        const filtered = user.log.filter(log => {
          new Date(log.date).toISOString().split('T')[0];
          return true;
        });
        //Taking into account if there is a "limit"
        user.log = limit ? filtered.slice(0, limit) : filtered;
      }
      res.json(user);
    }
  })   
})

/*    MY CODE FINISHES  */

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
