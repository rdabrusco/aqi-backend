const cron = require('cron');
const User = require("./models/User");
const emailjs = require('@emailjs/nodejs')
const axios = require("axios")
require("dotenv").config({ path: "./config/.env" });




// Define the cron schedule pattern (e.g., run every day at 3 AM)
const schedulePattern = '0 7 * * *'; // This pattern represents 3 AM daily

// init emailjs connection
emailjs.init({
    publicKey: process.env.PUBLIC_EMAIL_KEY,
    privateKey: process.env.PRIVATE_EMAIL_KEY
  });

// Define the API call function
const sendAllEmails = async () => {
  try{
    const users = await User.find({sendEmail: true})
    for(const user of users){
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

// Schedule the API call
const job = new cron.CronJob(schedulePattern, async () => {
    console.log('Scheduled API call started');
    await sendAllEmails();
    console.log('Scheduled API call finished');
});

job.start();