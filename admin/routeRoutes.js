const express = require("express");
const router = express.Router();
const axios = require("axios");
module.exports = (db) => {
  router.get("/get_complete_routes", async (req, res) => {
    try {
      const collection = db.collection("ROUTE_DETAILS");
      const result = await collection.find({}).toArray();
      res.send(result);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  router.get("/get_routes", async (req, res) => {
    try {
      const collection = db.collection("ROUTE_DETAILS");
      const data = await collection.find({}).toArray();
      res.send(data);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  router.get("/get_route_numbers", async (req, res) => {
    try {
      const collection = db.collection("ROUTE_DETAILS");
      const result = await collection.find({}).toArray();
      const routes = result.map(route => route.routeno);
      res.send(routes);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  router.post("/get_route_via_routeno", async (req, res) => {
    try {
      const collection = db.collection("ROUTE_DETAILS");
      const routeno = req.body.routeno;
      const result = await collection.find({ routeno: routeno }).toArray();
      const route = result[0].route.map(r => r.value);
      res.send(route);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  router.post("/save_route", async (req, res) => {
    try {
      const collection = db.collection("ROUTE_DETAILS");
      const result = await collection.insertOne({
        routeno: req.body.routeno,
        startpoint: req.body.startpoint,
        endpoint: req.body.endpoint,
        route: req.body.route,
      });
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error saving data", error });
    }
  });

  router.post("/save_bus_route", async (req, res) => {
    try {
      const collection = db.collection("BUS_ROUTE_TIMETABLE");
      const result = await collection.insertOne({
        busno: req.body.busno,
        routeno: req.body.routeno,
        days: req.body.selectedDays,
        timetable: req.body.timeTable,
      });
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error saving data", error });
    }
  });

  router.post("/update_bus_route", async (req, res) => {
    try {
      const collection = db.collection("BUS_ROUTE_TIMETABLE");
      const { busno, routeno, selectedDays, rows } = req.body;
      const result = await collection.updateOne(
        { busno, routeno },
        {
          $set: {
            days: selectedDays || [],
            timetable: rows || [],
          },
        },
        { upsert: true }
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error saving data", error });
    }
  });

  router.post("/search_route", async (req, res) => {
    try {
      const collection = db.collection("BUS_DETAILS");
      const { station_from, station_to } = req.body;

      const result = await collection
        .aggregate([
          {
            $match: {
              route: { $all: [station_from, station_to] },
            },
          },
          {
            $addFields: {
              from_index: { $indexOfArray: ["$route", station_from] },
              to_index: { $indexOfArray: ["$route", station_to] },
            },
          },
          {
            $match: {
              $expr: { $lt: ["$from_index", "$to_index"] },
            },
          },
        ])
        .toArray();

      res.send(result);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  return router;
};