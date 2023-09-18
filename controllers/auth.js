const User = require("../models/User");
const { createSecretToken } = require("../utils/secret");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "./config/.env" });
const jwt = require("jsonwebtoken");
const emailjs = require('@emailjs/nodejs')
const axios = require("axios")

module.exports.Signup = async (req, res, next) => {
  try {
    const { password } = req.body;
    const email = req.body.email.toLowerCase();
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
      const { password } = req.body;
      const email = req.body.email.toLowerCase();
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

module.exports.UpdateSendEmail = async (req, res) => {
  const token = req.cookies.token
  if (!token) {
    console.log(`no token`)
    return res.json({ status: false , message: "No token, not logged in"})
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
        console.log(`flipping sendUser to ${!user.sendEmail}`)
        await User.findOneAndUpdate(
          { _id: data.id},
          {
            sendEmail: !user.sendEmail,
          }
        );
        console.log("Updated sendEmail setting");
        res.status(201).json({message: `Successfully updated sendEmail setting to ${!user.sendEmail}`, sendEmail: !user.sendEmail});
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

module.exports.SendAllEmails = async () => {

  
  try{
    emailjs.init({
      publicKey: process.env.PUBLIC_EMAIL_KEY,
      privateKey: process.env.PRIVATE_EMAIL_KEY
    });
    const users = await User.find({sendEmail: true})
    for(const user of users){
      if(user.trackedLocations.length === 0) continue;
        const trackedData = await getAllTrackedData(user)
        console.log(trackedData)
        console.log(`sending email to ${user.email}`)

          const content = await createTable(trackedData)
          console.log(content)
          const templateParams = {
            to_name: user.email,
            html_table: content,
          }
          try {
            const response = await emailjs.send('aqi_checker', 'template_jhf575h', templateParams);
            console.log('SUCCESS!', response.status, response.text);
          } catch (error) {
            console.log('FAILED...', error);
          }
    }
  } catch(err){
    console.log(err)
  }
};

async function getAllTrackedData(user) {
    let allTrackedData = []
          console.log(`testing getting all tracked data`)
          for(let location of user.trackedLocations){
              try{
                const response = await axios.get(`https://api.waqi.info/feed/geo:${location.lat};${location.lon}/?token=${process.env.AQI_API_TOKEN}`);
                const data = response.data;
                  console.log(data)
                  allTrackedData.push({
                      location: location.name,
                      aqi: data.data.aqi
                  })
              } catch(err){
                  console.log(err)
              }
          }
  
          return allTrackedData
          
  }

  function createTable(data) {
    let tableHtml = '<table border="1"><thead><tr>';
    const colorMapping = {
      'bg-success': 'background-color: #00FF00; color: #000000' ,
      'bg-warning': 'background-color: #FFFF00;  color: #000000',
      'bg-orange': 'background-color: #FFA500;  color: #000000',
      'bg-danger': 'background-color: #FF0000; color: #FFFFFF;',
      'bg-very-unhealthy': 'background-color: #800080; color: #FFFFFF;',
      'bg-hazardous': 'background-color: #7E0023; color: #FFFFFF;',
    };
    // Create table header row using the keys of the first object in the array
    const keys = Object.keys(data[0]);
    keys.forEach((key) => {
      tableHtml += `<th>${key  === 'location' ? key[0].toUpperCase() + key.slice(1) : "AQI"}</th>`;
    });
  
    tableHtml += '</tr></thead><tbody>';
  
    // Create table rows with data from each object in the array
    data.forEach((item) => {
         // Get the background color based on the AQI value
         const backgroundColor = getCardColor(item.aqi);
  
         // Add the style attribute to the <tr> element with the background color
         tableHtml += `<tr style=" ${colorMapping[backgroundColor.split(" ")[0]]};">`;
     
      keys.forEach((key) => {
        tableHtml += `<td>${item[key]}</td>`;
      });
      tableHtml += '</tr>';
    });
  
    tableHtml += '</tbody></table>';
  
    return tableHtml;
  }
  
  const getCardColor = (aqi) => {
    // sets the card background color based off of the aqi 
      if (aqi <= 50) {
        return 'bg-success text-white';
      } else if (aqi <= 100) {
        return 'bg-warning';
      } else if (aqi <= 150) {
        return 'bg-orange';
      } else if (aqi <= 200) {
        return 'bg-danger text-white';
      } else if (aqi <= 300) {
        return 'bg-very-unhealthy text-white';
      } else {
        return 'bg-hazardous ';
      }
    }
