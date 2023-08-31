const User = require("../models/User");
const { createSecretToken } = require("../utils/secret");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "./config/.env" });
const jwt = require("jsonwebtoken");

module.exports.Signup = async (req, res, next) => {
  try {
    const { email, password} = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }
    const user = await User.create({ email, password });
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      withCredentials: true,
      httpOnly: false,
    });
    res
      .status(201)
      .json({ message: "User signed in successfully", success: true, user });
    next();
  } catch (error) {
    console.error(error);
  }
};

module.exports.Login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      console.log(email, password)
      if(!email || !password ){
        return res.json({message:'All fields are required'})
      }
      const user = await User.findOne({ email });
      if(!user){
        console.log(`no user found`)
        return res.json({message:'Incorrect password or email' }) 
      }
      console.log(`password === user.password: ${password === user.password}`)
      const auth = await bcrypt.compare(password,user.password)
      if (!auth) {
        console.log(`auth failed`)
        return res.json({message:'Incorrect password or email' }) 
      }
       const token = createSecretToken(user._id);
      //  console.log(token)
       console.log(`login successful`)
       res.cookie("token", token, {
         withCredentials: true,
         httpOnly: false,
       });
       res.status(201).json({ message: "User logged in successfully", success: true });
       next()
    } catch (error) {
      console.error(error);
    }
};

module.exports.EditTrackedLocations = async (req, res) => {
  const token = req.cookies.token
  if (!token) {
    console.log(`no token`)
    return res.json({ status: false })
  }
  jwt.verify(token, process.env.JWT_SECRET, async (err, data) => {
    if (err) {
      console.log(`error in jwt`)
     return res.json({ status: false })
    } else {
      try {
        console.log(req.body)
        const user = await User.findById(data.id)
        if(!user){
          console.log(`no user found`)
          return res.json({message:'Not logged in/no user found' }) 
        }
        const newTrackedLocations = updateArray(user.trackedLocations, req.body.currentLocation)
        console.log(`currently tracked locations: ${user.trackedLocations}, new list: ${newTrackedLocations}`)
        await User.findOneAndUpdate(
          { _id: data.id},
          {
            trackedLocations: newTrackedLocations,
          }
        );
        console.log("Updated tracked locations");
        res.status(201).json({message: `Successfully updated tracked locations`, trackedLocations: newTrackedLocations});
      } catch (err) {
        console.log(err);
      }
    }
  })
  
}

function updateArray(arrays, newArray) {
  const exists = arrays.some(array => JSON.stringify(array) === JSON.stringify(newArray));

  if (exists) {
    console.log(`location already in array removing location`)
    return arrays.filter(array => JSON.stringify(array) !== JSON.stringify(newArray));
  } else {
    console.log(`location not in array, adding location`)
    return arrays.concat([newArray]);
  }
}