const express = require("express");
const app = express();
const path = require('path');
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const methodOverride = require("method-override");
const flash = require("express-flash");
const logger = require("morgan");
const connectDB = require("./config/database");
const mainRoutes = require("./routes/main");
const cors = require("cors")

//Use .env file in config folder
require("dotenv").config({ path: "./config/.env" });

// Passport config
require("./config/passport")(passport);

//Connect To Database
// connectDB();

mongoose.set("strictQuery", false);
const mongoDB = process.env.DB_STRING


main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

//Using EJS for views
// app.set("view engine", "ejs");

//Static Folder
// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../air-quality-checker/src/build')));




//Body Parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());


//Logging
app.use(logger("dev"));

// Handles any requests that don't match the ones above

// app.get('*', (req,res) =>{
//   res.sendFile(path.join(__dirname+'/../air-quality-checker/public/index.html'));
// });

// app.get("/api/flash-messages", (req, res) => {
//   console.log(`testing`)
//   const flashMessages = req.flash("errors"); // Assuming flash messages are stored using req.flash("messages", messages)
//   console.log(`gitting flash-messages`)
//   return res.json(flashMessages);
// });


// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err); // Log the error for debugging purposes

  // Check if the error is a known error with a specific status code and message
  if (err.statusCode && err.message) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // For unknown errors, return a generic 500 error response
  res.status(500).json({ error: "Internal Server Error" });
});


//Use forms for put / delete
app.use(methodOverride("_method"));

// Setup Sessions - stored in MongoDB
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store:  MongoStore.create({ mongoUrl: process.env.DB_STRING }),
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Use flash messages for errors, info, ect...
app.use(flash());

//Setup Routes For Which The Server Is Listening
app.use("/api", mainRoutes);



//Server Running
app.listen(process.env.PORT || 8080, () => {
  console.log(`Server is running on port ${process.env.PORT || 8080}, you better catch it!`);
});
