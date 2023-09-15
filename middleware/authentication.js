const User = require("../models/User");
require("dotenv").config({ path: "./config/.env" });
const jwt = require("jsonwebtoken");

module.exports.userVerification = async (req, res) => {
  const token = req.cookies.token
  if (token === 'undefined') {
    console.log(`no token`)
    return res.json({ status: false })
  }
  jwt.verify(token, process.env.JWT_SECRET, async (err, data) => {
    if (err) {
      console.log(`error in userVerification: ${err}`)
     return res.json({ status: false })
    } else {
      const user = await User.findById(data.id)
      if (user) {
        console.log(`user verified logged in`)
        return res.json({ status: true, user: user})
      }
      else return res.json({ status: false })
    }
  })
}