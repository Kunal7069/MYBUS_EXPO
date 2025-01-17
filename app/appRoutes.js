const express = require("express");
const jwt = require('jsonwebtoken');
const router = express.Router();
const axios = require("axios");
module.exports = (db) => {
    function getDayFromDate(dateString) {
        const date = new Date(dateString);
        const daysOfWeek = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const dayIndex = date.getDay();
        return daysOfWeek[dayIndex];
      }
      function timeToMinutes(time) {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      }
router.get("/get_bus_stations", async (req, res) => {
  try {
    const collection = db.collection("BUS_STATIONS");
    const result = await collection.find({}).toArray();
    stations = [];
    for (let index = 0; index < result.length; index++) {
      stations.push(result[index]["name"]);
    }
    res.send(stations);
  } catch (error) {
    res.status(500).json({ message: "Error getting data", error });
  }
});

router.get("/get_eloc", async (req, res) => {
  try {
    const collection = db.collection("BUS_STATION_ADDRESS");
    const result = await collection.find({}).toArray();
    
    res.send(result);
  } catch (error) {
    res.status(500).json({ message: "Error getting data", error });
  }
});

router.post("/get_duration", async (req, res) => {
  try {
    const { start_station, end_station } = req.body; // Get input from user
    const collection = db.collection("BUS_STATION_ADDRESS");
    // Find the documents matching the start and end station names
    const result = await collection
      .find({
        name: { $in: [start_station, end_station] },
      })
      .toArray();
    // Extract eloc for start and end station
    const startStation = result.find(
      (station) => station.name === start_station
    );
    const endStation = result.find((station) => station.name === end_station);

    if (!startStation || !endStation) {
      return res.status(404).json({ message: "Stations not found" });
    }
  const elocString = `${startStation.eloc};${endStation.eloc}`; // Format the eLocs like "FKOWV8;XSW08E"
  const url = `https://apis.mappls.com/advancedmaps/v1/890814d4d077a249d2824317201f9c38/distance_matrix_eta/driving/${elocString}?rtype=0&region=IND`;
  try {
    // Call the Mappls Distance Matrix API
    const response = await axios.get(url, {
      headers: {
        accept: "application/json",
      },
    });
    // Send the response from the Mappls API back to the client
    const distance = response.data.results.distances[0][1];
    const duration = response.data.results.durations[0][1];
    console.log("DISTANCE",distance);
    console.log("TIME",duration);
    // Return only the distance and duration
    res.json({
      distance, // Distance in meters
      duration, // Duration in seconds
    });
  } catch (error) {
    res.status(500).json({ message: "Error getting data", error });
  }

}
catch (error) {
  res.status(500).json({ message: "Error getting data", error });
}
}
);

router.post("/find_routes", async (req, res) => {
  try {
    const { start_station, end_station, date, time } = req.body;
    const collection = db.collection("BUS_ROUTE_TIMETABLE");
    const busDetailsCollection = db.collection("BUS_DETAILS");
    const costDetailsCollection = db.collection("COST_DETAILS");
    const data = await collection.find({}).toArray();
    // const date = "2024-08-30";
    // const time = "00:00";
    const day = getDayFromDate(date);
    const userTimeInMinutes = timeToMinutes(time);
    const filteredRoutes = data.filter((route) => {
      if (!route.days.includes(day)) {
        return false;
      }
      const startIndex = route.timetable.findIndex(
        (t) => t.station === start_station
      );
      const endIndex = route.timetable.findIndex(
        (t) => t.station === end_station
      );
      if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        return false;
      }
      const startStationDepartureTime =
        route.timetable[startIndex].departure_time;
      const startStationDepartureTimeInMinutes = timeToMinutes(
        startStationDepartureTime
      );
      return startStationDepartureTimeInMinutes > userTimeInMinutes;
    });
    for (let route of filteredRoutes) {
      const busDetails = await busDetailsCollection.findOne({
        busno: route.busno,
      });
      if (busDetails) {
        route.bustype = busDetails.bustype;
        route.totalseats = busDetails.totalseats;
      }
      const costDetails = await costDetailsCollection.findOne({
        busno: route.busno,
        routeno: route.routeno,
        fromstation: start_station,
        tostation: end_station,
      });

      if (costDetails) {
        route.cost = costDetails.cost;
      } else {
        route.cost = "N/A"; // If no cost details are found
      }
    }
    res.send(filteredRoutes);
  } catch (error) {
    res.status(500).json({ message: "Error getting data", error });
  }
});

router.post("/token", async (req, res) => {
    const { client_id, client_secret } = req.body;
  
    if (!client_id || !client_secret) {
      return res.status(400).json({ message: "client_id and client_secret are required" });
    }
  
    try {
      const response = await axios.post(
        "https://outpost.mappls.com/api/security/oauth/token",
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id,
          client_secret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
        }
      );
  
      const access_token = response.data["access_token"];
      const currentDateTime = new Date(); // Get the current date and time
  
      // Insert the token, date, and time into MongoDB
      const tokenCollection = db.collection("TOKEN");
      await tokenCollection.insertOne({
        access_token,
        created_at: currentDateTime,
      });
  
      console.log("Access token saved to MongoDB:", access_token);
  
      // Send the token back to the client
      res.status(200).json(response.data);
    } catch (error) {
      console.error("Error fetching OAuth token:", error.response?.data || error.message);
      res.status(500).json({ message: "Failed to fetch OAuth token", error: error.response?.data || error.message });
    }
  });
  
  router.get("/latest_token", async (req, res) => {
    try {
      const tokenCollection = db.collection("TOKEN");
  
      // Fetch the latest token by sorting by created_at in descending order
      const latestToken = await tokenCollection
        .find({})
        .sort({ created_at: -1 })
        .limit(1)
        .toArray();
  
      if (latestToken.length === 0) {
        return res.status(404).json({ message: "No tokens found in the collection." });
      }
  
      res.status(200).json(latestToken[0]);
    } catch (error) {
      console.error("Error fetching the latest token:", error);
      res.status(500).json({ message: "Failed to fetch the latest token", error });
    }
  });
  
  // Signup API
  router.post('/signup', async (req, res) => {
    const { name, gender, email, phone } = req.body;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (phone.length < 10) {
      return res.status(400).json({ error: 'Mobile number must be at least 10 digits' });
    }

    try {
      const existingEmail = await db.collection("USERS").findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: 'User already exists with this Email' });
      }
      const existingPhone = await db.collection("USERS").findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ error: 'User already exists with this Phone Number' });
      }
      const newUser = {
        name,
        gender,
        email,
        phone,
      };

      const result = await db.collection("USERS").insertOne(newUser);

      res.status(201).json({ message: 'User registered successfully', userId: result.insertedId });
    } catch (error) {
      console.error('Error signing up:', error);
      res.status(500).json({ error: 'Error registering user' });
    }
  });


  router.post('/login', async (req, res) => {
    const { phone } = req.body;
    const ACCESS_TOKEN_SECRET = 'your_jwt_access_secret';
    const REFRESH_TOKEN_SECRET = 'your_jwt_refresh_secret';
    // Validate phone number
    if (!phone || phone.length < 10) {
        return res.status(400).json({ error: 'Mobile number must be at least 10 digits' });
    }

    try {
        // Check if user exists with the provided phone number
        const user = await db.collection("USERS").findOne({ phone });
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please sign up first.' });
        }

        // Generate access token (expires in 1 hour)
        const accessToken = jwt.sign({ userId: user._id }, ACCESS_TOKEN_SECRET, { expiresIn: '7d' });

        // Generate refresh token (expires in 7 days)
        const refreshToken = jwt.sign({ userId: user._id }, REFRESH_TOKEN_SECRET, { expiresIn: '1440h' });

        
        return res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                gender: user.gender,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Error logging in user' });
    }
});


router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  // Check if the refresh token is provided
  if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
  }

  // Verify the refresh token
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
          console.error('Refresh token verification error:', err.stack);
          return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      // Generate a new access token
      const newAccessToken = jwt.sign({ userId: decoded.userId }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      return res.status(200).json({
          message: 'Access token refreshed successfully',
          accessToken: newAccessToken
      });
  });
});

router.post('/otp',async  (req, res) => {
  try {
    const { name, gender, email, phone } = req.body;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (phone.length < 10) {
      return res.status(400).json({ error: 'Mobile number must be at least 10 digits' });
    }

  
      const existingEmail = await db.collection("USERS").findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: 'User already exists with this Email' });
      }
      const existingPhone = await db.collection("USERS").findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ error: 'User already exists with this Phone Number' });
      }

      const otp = Math.floor(1000 + Math.random() * 9000); // Ensures 4 digits

      // Send the OTP in the response
      res.status(200).json({
          message: 'OTP generated successfully',
          otp: otp
      });
  } catch (error) {
      console.error('Error generating OTP:', error);
      res.status(500).json({ error: 'Failed to generate OTP' });
  }
});  


  return router;  

}
