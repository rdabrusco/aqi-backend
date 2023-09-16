const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path")


// TODO: use nodemailer for email automation


require("dotenv").config({ path: "./config/.env" });

const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth");

const connectDb = require("./config/database")



//Connect To Database
connectDb();



const PORT = process.env.PORT;

app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);


app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend', 'build')));


app.use("/", authRoute);

require('./scheduledEmails');



app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});



