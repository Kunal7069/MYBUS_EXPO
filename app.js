const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const busRoutes = require("./admin/busRoutes");
const stationRoutes = require("./admin/stationRoutes");
const routeRoutes = require("./admin/routeRoutes");
const appRoutes = require("./app/appRoutes");

const app = express();
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));
app.use(express.json());

const port = 5000;
const url = "mongodb+srv://TEST:12345@mubustest.yfyj3.mongodb.net/";
const dbName = "RED-BUS";

let db;

MongoClient.connect(url, {})
  .then((client) => {
    db = client.db(dbName);
    console.log("Connected to MongoDB");
    
    // Pass db instance to routes
    app.use("/", busRoutes(db));
    app.use("/", stationRoutes(db));
    app.use("/", routeRoutes(db));
    app.use("/", appRoutes(db));
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});