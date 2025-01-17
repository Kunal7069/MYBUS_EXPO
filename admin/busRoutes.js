const express = require("express");
const { checkBusTimeConflicts } = require("../utils/timeUtils");
const router = express.Router();
const axios = require("axios");
module.exports = (db) => {
  // Bus related routes
  router.get("/get_buses", async (req, res) => {
    try {
      const collection = db.collection("BUS_DETAILS");
      const result = await collection.find({}).toArray();
      const buses = result.map(bus => bus.busno);
      res.send(buses);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  router.get("/get_bus_analyses", async (req, res) => {
    try {
      const collection = db.collection("BUS_DETAILS");
      const data = await collection.find({}).toArray();
      res.send(data);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  router.get("/get_bus_details", async (req, res) => {
    try {
      const collection = db.collection("BUS_DETAILS");
      const result = await collection.find({}).toArray();
      res.send(result);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  router.post("/check_busno_routeno", async (req, res) => {
    const { busno, routeno } = req.body;
    try {
      const collection = db.collection("BUS_DETAILS");
      const result = await collection.findOne({ busno, route: routeno });
      res.status(200).json({ exists: !!result });
    } catch (error) {
      res.status(500).json({ message: "Error checking route", error });
    }
  });

  router.post("/get_timetable_days", async (req, res) => {
    const { busno, routeno } = req.body;
    try {
      const collection = db.collection("BUS_ROUTE_TIMETABLE");
      const result = await collection.findOne({ busno, routeno });
      res.send(result);
    } catch (error) {
      res.status(500).json({ message: "Error checking route", error });
    }
  });

  router.post("/get_bus_timetable", async (req, res) => {
    try {
      const collection = db.collection("BUS_DETAILS");
      const result = await collection.find({ busno: req.body.busno }).toArray();
      res.send(result[0].rows);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  router.post("/save_bus", async (req, res) => {
    try {
      const collection = db.collection("BUS_DETAILS");
      const result = await collection.insertOne({
        busno: req.body.busno,
        bustype: req.body.bustype,
        totalseats: req.body.totalseats,
        route: req.body.route,
      });
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error saving data", error });
    }
  });

  router.post("/delete_bus_data", async (req, res) => {
    try {
      const collection_1 = db.collection("BUS_DETAILS");
      const collection_2 = db.collection("BUS_ROUTE_TIMETABLE");
      const busno = req.body.busno;

      const result_1 = await collection_1.deleteMany({ busno });
      const result_2 = await collection_2.deleteMany({ busno });

      if (result_1.deletedCount > 0) {
        res.json({ message: `${result_1.deletedCount} entries deleted successfully.` });
      } else {
        res.status(404).json({ message: "No entries found with the specified bus number." });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting data", error });
    }
  });

  router.post("/update_bus_timetable", async (req, res) => {
    try {
      const collection = db.collection("BUS_DETAILS");
      const { busno, rows } = req.body;
      const updateResult = await collection.updateOne(
        { busno },
        { $set: { rows } }
      );
      res.send(updateResult);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  router.post("/check_time_table", async (req, res) => {
    try {
      const collection = db.collection("BUS_ROUTE_TIMETABLE");
      const { busno, routeno, selectedDays, rows } = req.body;
      
      const result = await collection.find({ 
        busno,  
        routeno: { $ne: routeno } 
      }).toArray();
      
      const data = [
        ...result.map(item => ({
          days: item.days,
          timetable: item.timetable
        })),
        {
          days: selectedDays,
          timetable: rows
        }
      ];
      
      const conflicts = checkBusTimeConflicts(data);
      res.send(conflicts);
    } catch (error) {
      res.status(500).json({ message: "Error getting data", error });
    }
  });

  return router;
};