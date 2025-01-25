const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const connectToDatabase = require("../models/db");
const logger = require("../logger");

const directoryPath = "public/images";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Get all secondChanceItems
router.get("/", async (req, res, next) => {
  logger.info("/ called");
  try {
    const db = await connectToDatabase();
    const collection = db.collection("secondChanceItems");
    const secondChanceItems = await collection.find({}).toArray();
    res.json(secondChanceItems);
  } catch (e) {
    logger.console.error("oops something went wrong", e);
    next(e);
  }
});
// Add new item
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("secondChanceItems");
    let secondChanceItem = req.body;
    delete secondChanceItem._id;
    const lastItemQuery = await collection
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    if (lastItemQuery.length > 0) {
      secondChanceItem.id = (parseInt(lastItemQuery[0].id) + 1).toString();
    } else {
      secondChanceItem.id = "1";
    }
    const date_added = Math.floor(new Date().getTime() / 1000);
    secondChanceItem.date_added = date_added;
    const insertResult = await collection.insertOne(secondChanceItem);
    res.status(201).json(insertResult);
  } catch (e) {
    next(e);
  }
});
// Get a single secondChanceItem by ID
router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const db = await connectToDatabase();
    const collection = db.collection("secondChanceItems");
    const secondChanceItem = await collection.findOne({ id: id });
    if (!secondChanceItem) {
      return res.status(404).send("secondChanceItem not found");
    }
    res.json(secondChanceItem);
  } catch (e) {
    next(e);
  }
});
// Update and existing item
router.put("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const db = await connectToDatabase();
    const collection = db.collection("secondChanceItems");
    const secondChanceItem = await collection.findOne({ id });

    if (!secondChanceItem) {
      logger.error("secondChanceItem not found");
      return res.status(404).json({ error: "secondChanceItem not found" });
    }

    const updates = {
      category: req.body.category,
      condition: req.body.condition,
      age_days: req.body.age_days,
      description: req.body.description,
      age_years: Number((req.body.age_days / 365).toFixed(1)),
      updatedAt: new Date(),
    };

    const updateResult = await collection.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (updateResult) {
      res.json({ message: "Update successful" });
    } else {
      res.status(500).json({ message: "Update failed" });
    }
  } catch (e) {
    next(e);
  }
});
// Delete an existing item
router.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const db = await connectToDatabase();
    const collection = db.collection("secondChanceItems");
    const secondChanceItem = await collection.findOne({ id });
    if (!secondChanceItem) {
      logger.error(`secondChanceItem with id ${id} not found`);
      return res.status(404).json({ error: "secondChanceItem not found" });
    }
    const deleteResult = await collection.deleteOne({ id });
    if (deleteResult.deletedCount === 1) {
      logger.info(`Successfully deleted item with id: ${id}`);
      res.json({ message: "Deletion successful" });
    } else {
      logger.error(`Deletion failed for item with id: ${id}`);
      res.status(500).json({ error: "Deletion failed" });
    }
  } catch (e) {
    logger.error("Error during deletion", e);
    next(e);
  }
});

module.exports = router;
