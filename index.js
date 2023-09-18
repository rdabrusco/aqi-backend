const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path")


require("dotenv").config({ path: "./config/.env" });

const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth");

const connectDb = require("./config/database")



//Connect To Database
connectDb();



const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: ["https://aqi-checker.cyclic.app/", "https://busy-fish-gown.cyclic.app", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);


app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});



app.use("/", authRoute);

require('./scheduledEmails');



app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});



