const express = require("express");
const { findCoordinatesWithinRange } = require("../utils/locationUtils");
const router = express.Router();
const axios = require("axios");
module.exports = (db) => {
  router.get("/get_bus_stations", async (req, res) => {
    try {
      const collection = db.collection("BUS_STATIONS");
      const result = await collection.find({}).toArray();
      const stations = result.map(station => station.name);
      res.send(stations);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  router.post("/get_bus_stations_coordinates", async (req, res) => {
    try {
      const collection = db.collection("BUS_STATIONS");
      const result = await collection.find({}).toArray();
      const coordinates = result.map(station => ({
        name: station.name,
        lat: station.latitude,
        lng: station.longitude,
      }));

      const live_coordinate = req.body.live_coordinate;
      const nearbyCoords = findCoordinatesWithinRange(
        live_coordinate,
        coordinates,
        20
      );
      res.send(nearbyCoords);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  router.post("/save_bus_stop", async (req, res) => {
    try {
      const collection = db.collection("BUS_STATIONS");
      const result = await collection.insertOne({
        name: req.body.name,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      });
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error saving data", error });
    }
  });

  return router;
};